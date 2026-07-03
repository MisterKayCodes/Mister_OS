from sqlalchemy.orm import Session
from data.repository import LeadRepository, NoteRepository
from providers.llm_provider import LLMProvider
from data import vector, models
from core.prompts import Prompts
from sqlalchemy.orm import joinedload

class SalesService:
    @staticmethod
    async def process_incoming_message(db: Session, lead_username: str, message: str, role: str = "user"):
        """
        Handles an incoming message from a lead via the Microservice webhook.
        """
        # 1. Ensure lead exists
        lead = LeadRepository.get_by_username(db, lead_username)
        if not lead:
            lead = LeadRepository.create(db, {"username": lead_username, "status": "Cold"})
        
        # 2. Log interaction
        interaction = models.LeadInteraction(lead_id=lead.id, role=role, content=message)
        db.add(interaction)
        db.commit()

        # If it's a user message and lead is on auto_pilot, we draft a reply
        if role == "user" and lead.auto_pilot:
            await SalesService.draft_auto_reply(db, lead)

    @staticmethod
    async def draft_auto_reply(db: Session, lead: models.Lead):
        """
        Consults the Vector DB for similar past pitches and drafts a reply.
        """
        # Handle Context Window / Summarization
        all_interactions = db.query(models.LeadInteraction).filter(models.LeadInteraction.lead_id == lead.id).order_by(models.LeadInteraction.timestamp.asc()).all()
        summary_record = db.query(models.LeadSummary).filter(models.LeadSummary.lead_id == lead.id).first()
        
        # If more than 10 messages since last summary, summarize again
        if len(all_interactions) > (summary_record.message_count if summary_record else 0) + 10:
            chat_to_summarize = "\n".join([f"{msg.role}: {msg.content}" for msg in all_interactions])
            summary_prompt = f"Summarize this sales conversation briefly, highlighting key objections, price discussed, and current status:\n{chat_to_summarize}"
            new_summary = await LLMProvider.generate_completion(messages=[{"role": "user", "content": summary_prompt}], temperature=0.3)
            
            if summary_record:
                summary_record.summary = new_summary
                summary_record.message_count = len(all_interactions)
            else:
                summary_record = models.LeadSummary(lead_id=lead.id, summary=new_summary, message_count=len(all_interactions))
                db.add(summary_record)
            db.commit()

        # Fetch last 3 messages for immediate context
        history = all_interactions[-3:]
        chat_context = "\n".join([f"{msg.role}: {msg.content}" for msg in history])
        
        # Add summary to context if exists
        if summary_record:
            chat_context = f"PREVIOUS CHAT SUMMARY:\n{summary_record.summary}\n\nCURRENT CHAT:\n{chat_context}"
        else:
            chat_context = f"CURRENT CHAT:\n{chat_context}"
        
        # Pull best practices from Vector DB using semantic search
        training_context = vector.query_relevant_notes(chat_context, n_results=2)
        training_str = "\n\n".join(training_context) if training_context else "No relevant training found."
        
        # Pull Price DB Context to prevent hallucinations
        price_logs = db.query(models.PriceLog).all()
        products = db.query(models.Product).all()
        product_map = {p.id: p.name for p in products}
        price_context = "PRICE DB (Do NOT invent prices or products not listed here):\n"
        if price_logs:
            for log in price_logs:
                product_name = product_map.get(log.product_id, "Unknown Product")
                price_context += f"- {product_name}: {log.price} Naira\n"
        else:
            price_context += "No pricing available. Handoff if asked about price."

        # Prompt
        system_prompt = f"""You are Mister, an expert closer. Draft a short, punchy reply to this lead.
        
        {price_context}
        
        TRAINING DATA (Past successful pitches):
        {training_str}
        
        RULES:
        1. Keep it short.
        2. Match the tone of the training data.
        3. If they ask for a video, price (not in DB), or payment link, output ONLY: [HANDOFF]
        
        {chat_context}
        """
        
        reply = await LLMProvider.generate_completion(messages=[{"role": "system", "content": system_prompt}], temperature=0.7)
        
        if "[HANDOFF]" in reply:
            lead.auto_pilot = False
            db.commit()
            # Trigger handoff alert (in a full build, send message to user's main telegram)
            print(f"HANDOFF TRIGGERED for @{lead.username}")
        else:
            # Save the drafted reply as 'assistant' but don't send it yet (Approval Mode)
            # Or if fully autonomous, we'd hit the Microservice here.
            interaction = models.LeadInteraction(lead_id=lead.id, role="assistant", content=reply, is_draft=True)
            db.add(interaction)
            db.commit()
