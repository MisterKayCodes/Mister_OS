from sqlalchemy.orm import Session
from data.repository import ChatRepository, FinanceRepository
from data import vector, models
from providers.llm_provider import LLMProvider
from core.prompts import Prompts
from services.finance_service import FinanceService

class AIService:
    @staticmethod
    async def process_omni_chat(db: Session, message: str, session_id: int = None) -> dict:
        """
        The Nervous System for Omni-Brain.
        Coordinates Vector search, LLM completion, and Finance logging.
        """
        # 1. Retrieve Context from Vector DB (Memory)
        relevant_notes = vector.query_relevant_notes(message, n_results=3)
        context_text = "\n\n".join(relevant_notes) if relevant_notes else "No relevant notes found."
        
        # 2. Retrieve Context from Price DB (Memory)
        products = db.query(models.Product).all()
        price_context_lines = []
        for p in products:
            if p.name.lower() in message.lower():
                latest_log = db.query(models.PriceLog).filter(models.PriceLog.product_id == p.id).order_by(models.PriceLog.date.desc()).first()
                if latest_log:
                    vendor = db.query(models.Vendor).filter(models.Vendor.id == latest_log.vendor_id).first()
                    v_name = vendor.name if vendor else "Unknown"
                    price_context_lines.append(f"- {p.name} at {v_name}: ₦{latest_log.price}")
        price_context_text = "\n".join(price_context_lines) if price_context_lines else "No relevant price data found."
        
        # 3. Build the System Prompt (Brain)
        system_prompt = Prompts.get_omni_chat_system_prompt(context_text, price_context_text)
        
        # 4. Handle Chat Session History (Memory)
        if not session_id:
            db_session = ChatRepository.create_session(db, title=message[:30] + "...")
            session_id = db_session.id
            
        ChatRepository.create_message(db, session_id, role="user", content=message)
        history = ChatRepository.get_history(db, session_id, limit=10)
        
        messages = [{"role": "system", "content": system_prompt}]
        for msg in history:
            messages.append({"role": msg.role, "content": msg.content})
            
        # 5. Call LLM (Eyes/Mouth via Provider)
        ai_reply = await LLMProvider.generate_completion(messages=messages, temperature=0.7)
        
        # 6. Intercept Autonomous Commands (Nervous System orchestrates)
        final_reply = FinanceService.execute_autonomous_commands(db, ai_reply)
        
        if not final_reply:
            final_reply = "Done! I've logged that for you."
            
        # 7. Save Assistant Message (Memory)
        db_ai_msg = ChatRepository.create_message(db, session_id, role="assistant", content=final_reply)
        
        return {
            "id": db_ai_msg.id, 
            "role": db_ai_msg.role, 
            "content": db_ai_msg.content, 
            "session_id": session_id, 
            "created_at": db_ai_msg.created_at
        }
