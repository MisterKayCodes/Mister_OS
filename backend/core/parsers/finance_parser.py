import re
import datetime
from typing import List, Dict, Any

class FinanceParser:
    @staticmethod
    def parse_date_tag(date_str: str) -> datetime.datetime:
        date_str = date_str.lower().strip()
        now = datetime.datetime.now()
        if date_str == "today":
            return now
        elif date_str == "yesterday":
            return now - datetime.timedelta(days=1)
        
        days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
        if date_str in days:
            target_day = days.index(date_str)
            current_day = now.weekday()
            diff = current_day - target_day
            if diff <= 0:
                diff += 7
            return now - datetime.timedelta(days=diff)
            
        try:
            return datetime.datetime.strptime(date_str, "%Y-%m-%d")
        except ValueError:
            return now

    @staticmethod
    def parse_note_content(content: str, current_usd_rate: float = 1500.0) -> List[Dict[str, Any]]:
        """
        Takes raw string content and returns a list of dictionaries representing the parsed transactions.
        Pure computation. Does NOT touch the database.
        """
        prefix_pattern = r"^\s*/(spend|income|save|owe|paid-back)\s+(\$?)(\d+(?:\.\d+)?)\s+(.*)$"
        transactions = []
        
        for line in content.split('\n'):
            match = re.match(prefix_pattern, line, re.IGNORECASE)
            if match:
                cmd = match.group(1).lower()
                is_usd = match.group(2) == '$'
                amount = float(match.group(3))
                rest_of_line = match.group(4).strip()
                
                tag = "uncategorized"
                date_tag = None
                desc = rest_of_line
                
                # Extract #tag and @date from the end of the line
                while True:
                    end_match = re.search(r"\s+(?:#(\w+)|@([\w-]+))$", desc)
                    if not end_match:
                        break
                    if end_match.group(1):
                        tag = end_match.group(1).lower()
                    elif end_match.group(2):
                        date_tag = end_match.group(2).lower()
                    desc = desc[:end_match.start()].strip()
                
                tx_type = "expense"
                if cmd == "income": tx_type = "income"
                elif cmd == "save": tx_type = "save"
                elif cmd in ["owe", "paid-back"]: continue
                
                rate = current_usd_rate if is_usd else 1.0
                naira_amt = int(amount * rate) if is_usd else int(amount)
                    
                tx_date = None
                if date_tag:
                    tx_date = FinanceParser.parse_date_tag(date_tag)
                
                transactions.append({
                    "type": tx_type,
                    "amount_naira": naira_amt,
                    "original_amount": amount if is_usd else None,
                    "original_currency": "USD" if is_usd else "NGN",
                    "exchange_rate": rate,
                    "description": desc,
                    "category": tag,
                    "parsed_date": tx_date
                })
                
        return transactions
