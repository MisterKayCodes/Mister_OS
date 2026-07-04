from sqlalchemy.orm import Session
from data.repository import FinanceRepository, NoteRepository
from data import models
from core.parsers.finance_parser import FinanceParser
from providers.exchange_provider import ExchangeProvider
import re

class FinanceService:
    @staticmethod
    def sync_note_transactions(db: Session, note_id: int, content: str):
        """
        Orchestrates parsing a note and updating the database transactions.
        """
        # 1. Ask the Eyes (ExchangeProvider) for current rate
        usd_rate = ExchangeProvider.get_usd_to_ngn_rate()

        # 2. Ask the Brain (FinanceParser) to parse the note
        parsed_txs = FinanceParser.parse_note_content(content, usd_rate)

        # 3. Retrieve Memory (existing transactions)
        existing_txs = FinanceRepository.get_transactions_by_note(db, note_id)
        existing_pool = list(existing_txs)

        # 4. Handle Wallet Deductions
        from data import models
        settings = db.query(models.FinanceSettings).first()
        default_wallet = None
        if settings and settings.default_wallet_id:
            default_wallet = db.query(models.Wallet).filter(models.Wallet.id == settings.default_wallet_id).first()

        # Reverse old transactions from wallet
        if default_wallet:
            for ex_tx in existing_pool:
                if ex_tx.type == "expense":
                    default_wallet.balance += ex_tx.amount_naira
                elif ex_tx.type == "income":
                    default_wallet.balance -= ex_tx.amount_naira

        # 5. Clear old Memory
        FinanceRepository.delete_transactions_by_note(db, note_id)

        # 6. Save new Memory
        import datetime
        for tx_data in parsed_txs:
            tx_type = tx_data["type"]
            naira_amt = tx_data["amount_naira"]
            desc = tx_data["description"]
            tag = tx_data["category"]
            
            if not tx_data["parsed_date"]:
                match_idx = -1
                for i, ex_tx in enumerate(existing_pool):
                    if ex_tx.type == tx_type and ex_tx.amount_naira == naira_amt and ex_tx.description == desc and ex_tx.category == tag:
                        match_idx = i
                        break
                if match_idx >= 0:
                    matched_tx = existing_pool.pop(match_idx)
                    tx_data["parsed_date"] = matched_tx.date
                else:
                    tx_data["parsed_date"] = datetime.datetime.now()
            
            # Apply new transactions to wallet
            if default_wallet:
                if tx_type == "expense":
                    default_wallet.balance -= naira_amt
                elif tx_type == "income":
                    default_wallet.balance += naira_amt
            
            # Re-map key for DB
            db_date = tx_data.pop("parsed_date")
            tx_data["date"] = db_date
            tx_data["note_id"] = note_id
            
            FinanceRepository.create_transaction(db, tx_data)
            
        if default_wallet:
            db.commit()

    @staticmethod
    def execute_autonomous_commands(db: Session, llm_reply: str) -> tuple[str, list[dict]]:
        """
        Extracts [LOG_EXPENSE] and [LOG_PRICE] tags from the LLM reply,
        acts upon them, and returns (cleaned_reply, list_of_action_results).
        """
        results = []
        
        # Process [LOG_PRICE: product, vendor, price]
        price_matches = re.findall(r"\[LOG_PRICE:\s*(.+?),\s*(.+?),\s*(\d+)\]", llm_reply)
        for product_name, vendor_name, price in price_matches:
            product_name = product_name.strip()
            vendor_name = vendor_name.strip()
            
            try:
                vendor = FinanceRepository.get_vendor_by_name(db, vendor_name)
                if not vendor:
                    vendor = FinanceRepository.create_vendor(db, vendor_name)
                    
                product = FinanceRepository.get_product_by_name(db, product_name)
                if not product:
                    product = FinanceRepository.create_product(db, product_name)
                    
                FinanceRepository.create_price_log(db, product.id, vendor.id, int(price))
                results.append({
                    "action": "price",
                    "success": True,
                    "detail": f"Updated price of {product_name} at {vendor_name} to ₦{int(price):,}"
                })
            except Exception as e:
                results.append({
                    "action": "price",
                    "success": False,
                    "detail": f"Attempted to update price for {product_name}",
                    "error": str(e)
                })
            
        llm_reply = re.sub(r"\[LOG_PRICE:.*?\]\n?", "", llm_reply)
        
        # Process [LOG_EXPENSE: /spend ...]
        expense_matches = re.findall(r"\[LOG_EXPENSE:\s*(.+?)\]", llm_reply)
        for cmd_str in expense_matches:
            from services.note_service import NoteService
            cmd_clean = cmd_str.strip()
            
            try:
                # 1. Verification: check default wallet settings
                settings = db.query(models.FinanceSettings).first()
                default_wallet = None
                if settings and settings.default_wallet_id:
                    default_wallet = db.query(models.Wallet).filter(models.Wallet.id == settings.default_wallet_id).first()
                
                if not default_wallet:
                    results.append({
                        "action": "expense",
                        "success": False,
                        "detail": f"Log expense: '{cmd_clean}'",
                        "error": "No default spending wallet is set. Please set a default spending wallet in the Finance tab (click Star icon on a Liquid wallet) first."
                    })
                    continue
                
                # 2. Verification: Try to parse command format
                from core.parsers.finance_parser import FinanceParser
                parsed = FinanceParser.parse_note_content(cmd_clean)
                if not parsed:
                    results.append({
                        "action": "expense",
                        "success": False,
                        "detail": f"Log expense: '{cmd_clean}'",
                        "error": "Command format could not be parsed. Ensure it starts with /spend, /income, or /save followed by amount and description."
                    })
                    continue
                
                # Try exact match first, then case-insensitive "ledger" fallback
                note = NoteRepository.get_by_title(db, "Finance Ledger")
                if not note:
                    note = db.query(models.Note).filter(models.Note.title.ilike("%ledger%")).first()
                if not note:
                    note = NoteRepository.create(db, "Finance Ledger", "")
                
                new_content = note.content + f"\n{cmd_clean}"
                
                # Route through NoteService to keep vector store in sync
                NoteService.update_note(db, note.id, content=new_content)
                
                p = parsed[0]
                results.append({
                    "action": "expense",
                    "success": True,
                    "detail": f"Logged {p['type']}: ₦{p['amount_naira']:,} for '{p['description']}' (#{p['category']}) to spending wallet '{default_wallet.name}'."
                })
            except Exception as e:
                results.append({
                    "action": "expense",
                    "success": False,
                    "detail": f"Log expense: '{cmd_clean}'",
                    "error": str(e)
                })
            
        llm_reply = re.sub(r"\[LOG_EXPENSE:.*?\]\n?", "", llm_reply)
        return llm_reply.strip(), results
