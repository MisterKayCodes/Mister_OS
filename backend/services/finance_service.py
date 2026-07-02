from sqlalchemy.orm import Session
from data.repository import FinanceRepository
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

        # 4. Clear old Memory
        FinanceRepository.delete_transactions_by_note(db, note_id)

        # 5. Save new Memory
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
            
            # Re-map key for DB
            db_date = tx_data.pop("parsed_date")
            tx_data["date"] = db_date
            tx_data["note_id"] = note_id
            
            FinanceRepository.create_transaction(db, tx_data)

    @staticmethod
    def execute_autonomous_commands(db: Session, llm_reply: str) -> str:
        """
        Extracts [LOG_EXPENSE] and [LOG_PRICE] tags from the LLM reply,
        acts upon them, and strips them from the returned string.
        """
        from data.repository import NoteRepository
        
        # Process [LOG_PRICE: product, vendor, price]
        price_matches = re.findall(r"\[LOG_PRICE:\s*(.+?),\s*(.+?),\s*(\d+)\]", llm_reply)
        for product_name, vendor_name, price in price_matches:
            product_name = product_name.strip()
            vendor_name = vendor_name.strip()
            
            vendor = FinanceRepository.get_vendor_by_name(db, vendor_name)
            if not vendor:
                vendor = FinanceRepository.create_vendor(db, vendor_name)
                
            product = FinanceRepository.get_product_by_name(db, product_name)
            if not product:
                product = FinanceRepository.create_product(db, product_name)
                
            FinanceRepository.create_price_log(db, product.id, vendor.id, int(price))
            
        llm_reply = re.sub(r"\[LOG_PRICE:.*?\]\n?", "", llm_reply)
        
        # Process [LOG_EXPENSE: /spend ...]
        expense_matches = re.findall(r"\[LOG_EXPENSE:\s*(.+?)\]", llm_reply)
        for cmd_str in expense_matches:
            ledger_title = "Finance Ledger"
            note = NoteRepository.get_by_title(db, ledger_title)
            if not note:
                note = NoteRepository.create(db, ledger_title, "")
            
            note.content += f"\n{cmd_str.strip()}"
            NoteRepository.update(db, note)
            
            FinanceService.sync_note_transactions(db, note.id, note.content)
            
        llm_reply = re.sub(r"\[LOG_EXPENSE:.*?\]\n?", "", llm_reply)
        return llm_reply.strip()
