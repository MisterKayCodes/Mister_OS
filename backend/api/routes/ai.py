from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from api.dependencies import get_master_token
from data import database, schemas, models
from services.ai_service import AIService
from providers.llm_provider import LLMProvider
from core.prompts import Prompts

router = APIRouter(prefix="/api/ai", tags=["AI"])

def _log_tokens(db: Session, task_name: str, usage: dict):
    """Save a token usage log row silently."""
    try:
        db.add(models.TokenUsageLog(
            task_name=task_name,
            prompt_tokens=usage.get("prompt_tokens", 0),
            completion_tokens=usage.get("completion_tokens", 0),
            total_tokens=usage.get("total_tokens", 0),
            model=usage.get("model", "unknown")
        ))
        db.commit()
    except Exception:
        pass  # Never crash the main flow over logging

@router.post("/generate-title", response_model=schemas.TitleGenerateResponse)
async def generate_title(request: schemas.TitleGenerateRequest, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    try:
        prompt = Prompts.get_title_generation_prompt(request.content)
        messages = [{"role": "user", "content": prompt}]
        title, usage = await LLMProvider.generate_completion(messages=messages, temperature=0.3, max_tokens=20)
        _log_tokens(db, "generate_title", usage)
        return schemas.TitleGenerateResponse(title=title.strip().strip('"').strip("'"))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze-chat", response_model=schemas.ChatAnalysisResponse)
async def analyze_chat(request: schemas.ChatAnalysisRequest, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    try:
        prompt = Prompts.get_chat_analysis_prompt(request.chat_log)
        messages = [{"role": "user", "content": prompt}]
        analysis, usage = await LLMProvider.generate_completion(messages=messages, temperature=0.5, max_tokens=1024)
        _log_tokens(db, "analyze_chat", usage)
        return schemas.ChatAnalysisResponse(analysis=analysis)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/omni-chat", response_model=schemas.ChatMessageResponse)
async def omni_chat(request: schemas.OmniChatRequest, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    try:
        return await AIService.process_omni_chat(db, request.message, request.session_id)
    except Exception as e:
        print(f"Exception in Omni-Chat: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/chat-sessions", response_model=list[schemas.ChatSessionResponse])
def get_chat_sessions(db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    return db.query(models.ChatSession).order_by(models.ChatSession.updated_at.desc()).all()

@router.get("/chat-sessions/{session_id}", response_model=list[schemas.ChatMessageResponse])
def get_chat_messages(session_id: int, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    return db.query(models.ChatMessage).filter(models.ChatMessage.session_id == session_id).order_by(models.ChatMessage.id.asc()).all()

@router.post("/finance-insights", response_model=schemas.FinanceInsightsResponse)
async def finance_insights(db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    try:
        from datetime import datetime, timedelta
        since = datetime.now() - timedelta(days=30)
        txs = db.query(models.Transaction).filter(models.Transaction.date >= since).all()
        tx_summary = "\n".join([f"- {t.type.upper()} ₦{t.amount_naira:,} | {t.description} #{t.category} on {t.date.strftime('%b %d')}" for t in txs]) or "No transactions in the last 30 days."
        wallets = db.query(models.Wallet).all()
        wallet_summary = "\n".join([f"- {w.name} ({w.type}): ₦{w.balance:,}" for w in wallets]) or "No wallets set up."
        prompt = Prompts.get_finance_insights_prompt(wallet_summary, tx_summary)
        messages = [{"role": "user", "content": prompt}]
        insights, usage = await LLMProvider.generate_completion(messages=messages, temperature=0.5)
        _log_tokens(db, "finance_insights", usage)
        return schemas.FinanceInsightsResponse(insights=insights)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/can-i-afford", response_model=schemas.CanIAffordResponse)
async def can_i_afford(request: schemas.CanIAffordRequest, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    try:
        wallets = db.query(models.Wallet).all()

        # Separate liquid (spendable now) from locked/investment (not easily accessible)
        liquid_wallets = [w for w in wallets if w.type.lower() == 'liquid']
        locked_wallets = [w for w in wallets if w.type.lower() in ('locked', 'investment', 'savings')]

        liquid_total = sum(w.balance for w in liquid_wallets)
        locked_total = sum(w.balance for w in locked_wallets)
        grand_total = liquid_total + locked_total

        liquid_lines = "\n".join([f"  - {w.name}: ₦{w.balance:,}" for w in liquid_wallets]) or "  None"
        locked_lines = "\n".join([f"  - {w.name} ({w.type}): ₦{w.balance:,}" for w in locked_wallets]) or "  None"

        wallet_summary = (
            f"LIQUID (spendable right now) — Total: ₦{liquid_total:,}\n{liquid_lines}\n\n"
            f"LOCKED/SAVINGS (not easily accessible) — Total: ₦{locked_total:,}\n{locked_lines}\n\n"
            f"GRAND TOTAL: ₦{grand_total:,}"
        )

        goals = db.query(models.Goal).filter(models.Goal.achieved == False).all()
        goal_summary = "\n".join([f"- {g.name}: ₦{g.price_min:,}–₦{g.price_max or g.price_min:,}" for g in goals]) or "No active goals."
        prompt = Prompts.get_affordability_prompt(request.query, wallet_summary, goal_summary)
        messages = [{"role": "user", "content": prompt}]
        answer, usage = await LLMProvider.generate_completion(messages=messages, temperature=0.4, max_tokens=512)
        _log_tokens(db, "can_i_afford", usage)
        return schemas.CanIAffordResponse(answer=answer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/token-stats")
def get_token_stats(db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    import os
    from datetime import datetime, timedelta, timezone
    from sqlalchemy import func as sqlfunc

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

    def weight(t):
        if t >= 5000: return "heavy"
        if t >= 500:  return "moderate"
        return "light"

    by_task = sorted(
        [{"task": r.task_name, "tokens": int(r.tokens), "weight": weight(int(r.tokens))} for r in rows],
        key=lambda x: x["tokens"], reverse=True
    )
    daily_total = sum(t["tokens"] for t in by_task)
    percent_used = round((daily_total / daily_limit) * 100, 1)

    return {
        "daily_total": daily_total,
        "daily_limit": daily_limit,
        "percent_used": percent_used,
        "by_task": by_task,
        "reset_at": "midnight UTC"
    }

