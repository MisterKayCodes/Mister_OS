from sqlalchemy.orm import Session
from data.repository import ChatRepository, FinanceRepository
from data import vector, models
from providers.llm_provider import LLMProvider
from core.prompts import Prompts
from services.finance_service import FinanceService
import re

class AIService:
    @staticmethod
    async def process_omni_chat(db: Session, message: str, session_id: int = None) -> dict:
        """
        The Nervous System for Omni-Brain.
        Coordinates Vector search, LLM completion, Finance logging, and Token tracking.
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
        
        # 3. Retrieve Latest Sales Pipeline Analysis (War Room Intelligence)
        pipeline_context = ""
        try:
            latest_report = db.query(models.AnalysisReport).order_by(models.AnalysisReport.created_at.desc()).first()
            if latest_report:
                pipeline_context = (
                    f"WHAT'S WORKING:\n{latest_report.working_patterns}\n\n"
                    f"WHAT'S KILLING CONVERSIONS:\n{latest_report.killing_patterns}\n\n"
                    f"PAIN POINTS:\n{latest_report.pain_points}\n\n"
                    f"TOP OPENER PATTERNS:\n{latest_report.top_openers}"
                )
        except Exception:
            pass  # Silently skip if table doesn't exist yet

        # 4. Retrieve Today's Token Usage (Budget Awareness)
        token_context = ""
        try:
            from datetime import datetime, timezone
            from sqlalchemy import func as sqlfunc
            import os
            daily_limit = int(os.getenv("GROQ_DAILY_TOKEN_LIMIT", "131072"))
            now = datetime.now(timezone.utc)
            day_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            rows = (
                db.query(
                    models.TokenUsageLog.task_name,
                    sqlfunc.sum(models.TokenUsageLog.total_tokens).label("tokens")
                )
                .filter(models.TokenUsageLog.created_at >= day_start)
                .group_by(models.TokenUsageLog.task_name)
                .all()
            )
            daily_total = sum(int(r.tokens) for r in rows)
            percent_used = round((daily_total / daily_limit) * 100, 1)
            task_breakdown = ", ".join([f"{r.task_name}: {int(r.tokens):,}" for r in sorted(rows, key=lambda x: x.tokens, reverse=True)])
            token_context = (
                f"TOKEN BUDGET TODAY: {daily_total:,} / {daily_limit:,} tokens used ({percent_used}%)\n"
                f"Breakdown: {task_breakdown or 'No usage yet'}"
            )
        except Exception:
            pass

        # 5. Build the System Prompt (Brain)
        has_default_wallet = True  # Default to True so bot can log if settings table missing
        try:
            settings = db.query(models.FinanceSettings).first()
            if settings is not None:
                has_default_wallet = bool(settings.default_wallet_id)
        except Exception:
            pass  # Table may not exist yet on VPS — allow logging by default
        system_prompt = Prompts.get_omni_chat_system_prompt(context_text, price_context_text, pipeline_context, token_context, has_default_wallet)
        
        # 6. Handle Chat Session History (Memory)
        if not session_id:
            db_session = ChatRepository.create_session(db, title=message[:30] + "...")
            session_id = db_session.id
            
        ChatRepository.create_message(db, session_id, role="user", content=message)
        history = ChatRepository.get_history(db, session_id, limit=10)
        
        messages = [{"role": "system", "content": system_prompt}]
        for msg in history:
            messages.append({"role": msg.role, "content": msg.content})
            
        # 7. Call LLM and capture usage
        ai_reply, usage = await LLMProvider.generate_completion(messages=messages, temperature=0.7)
        
        # 8. Log token usage silently
        try:
            db.add(models.TokenUsageLog(
                task_name="omni_chat",
                prompt_tokens=usage.get("prompt_tokens", 0),
                completion_tokens=usage.get("completion_tokens", 0),
                total_tokens=usage.get("total_tokens", 0),
                model=usage.get("model", "unknown")
            ))
            db.commit()
        except Exception:
            pass

        # 9. Intercept Autonomous Commands (Nervous System orchestrates)
        final_reply, results = FinanceService.execute_autonomous_commands(db, ai_reply)
        
        # Intercept autonomous TASK commands
        task_matches = re.findall(r"\[?CREATE_TASK:\s*([^\]\n]+)\]?", final_reply)
        for task_title in task_matches:
            task_title_clean = task_title.strip()
            try:
                db_task = models.Task(
                    title=task_title_clean,
                    description="Created autonomously by OmniBrain",
                    status="pending"
                )
                db.add(db_task)
                db.commit()
                results.append({
                    "action": "task",
                    "success": True,
                    "detail": f"Created task: '{task_title_clean}' in Task Center."
                })
            except Exception as e:
                results.append({
                    "action": "task",
                    "success": False,
                    "detail": f"Attempted to create task: '{task_title_clean}'",
                    "error": str(e)
                })
        final_reply = re.sub(r"\[?CREATE_TASK:.*?\]?(?:\n|$)", "", final_reply).strip()
        
        if results:
            status_lines = ["", "─────────────────────────"]
            for res in results:
                icon = "✅" if res["success"] else "❌"
                if res["success"]:
                    status_lines.append(f"{icon} {res['detail']}")
                else:
                    status_lines.append(f"{icon} Failed to execute action.")
                    status_lines.append(f"   Details: {res['detail']}")
                    if "error" in res:
                        status_lines.append(f"   Reason: {res['error']}")
            status_lines.append("─────────────────────────")
            final_reply = (final_reply + "\n" + "\n".join(status_lines)).strip()
        elif not final_reply:
            final_reply = "Got it! Let me know if you need anything else."
            
        # 10. Save Assistant Message (Memory)
        db_ai_msg = ChatRepository.create_message(db, session_id, role="assistant", content=final_reply)
        
        return {
            "id": db_ai_msg.id, 
            "role": db_ai_msg.role, 
            "content": db_ai_msg.content, 
            "session_id": session_id, 
            "created_at": db_ai_msg.created_at
        }

