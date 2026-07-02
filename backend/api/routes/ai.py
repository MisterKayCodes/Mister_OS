from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from api.dependencies import get_master_token
from data import database, schemas, models
from services.ai_service import AIService
from providers.llm_provider import LLMProvider
from core.prompts import Prompts

router = APIRouter(prefix="/api/ai", tags=["AI"])

@router.post("/generate-title", response_model=schemas.TitleGenerateResponse)
async def generate_title(request: schemas.TitleGenerateRequest, token: str = Depends(get_master_token)):
    try:
        prompt = Prompts.get_title_generation_prompt(request.content)
        messages = [{"role": "user", "content": prompt}]
        title = await LLMProvider.generate_completion(messages=messages, temperature=0.3, max_tokens=20)
        return schemas.TitleGenerateResponse(title=title.strip().strip('"').strip("'"))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze-chat", response_model=schemas.ChatAnalysisResponse)
async def analyze_chat(request: schemas.ChatAnalysisRequest, token: str = Depends(get_master_token)):
    try:
        prompt = Prompts.get_chat_analysis_prompt(request.chat_log)
        messages = [{"role": "user", "content": prompt}]
        analysis = await LLMProvider.generate_completion(messages=messages, temperature=0.5, max_tokens=1024)
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
    return db.query(models.ChatSession).order_by(models.ChatSession.last_active.desc()).all()

@router.get("/chat-sessions/{session_id}", response_model=list[schemas.ChatMessageResponse])
def get_chat_messages(session_id: int, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    return db.query(models.ChatMessage).filter(models.ChatMessage.session_id == session_id).order_by(models.ChatMessage.id.asc()).all()

@router.post("/finance-insights", response_model=schemas.FinanceInsightsResponse)
async def finance_insights(db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    try:
        # In a real app, this logic should also go to FinanceService, but we'll do it quickly here
        from datetime import datetime, timedelta
        since = datetime.now() - timedelta(days=30)
        txs = db.query(models.Transaction).filter(models.Transaction.date >= since).all()
        tx_summary = "\n".join([f"- {t.type.upper()} ₦{t.amount_naira:,} | {t.description} #{t.category} on {t.date.strftime('%b %d')}" for t in txs]) or "No transactions in the last 30 days."

        wallets = db.query(models.Wallet).all()
        wallet_summary = "\n".join([f"- {w.name} ({w.type}): ₦{w.balance:,}" for w in wallets]) or "No wallets set up."

        prompt = Prompts.get_finance_insights_prompt(wallet_summary, tx_summary)
        messages = [{"role": "user", "content": prompt}]
        insights = await LLMProvider.generate_completion(messages=messages, temperature=0.5)
        return schemas.FinanceInsightsResponse(insights=insights)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/can-i-afford", response_model=schemas.CanIAffordResponse)
async def can_i_afford(request: schemas.CanIAffordRequest, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    try:
        wallets = db.query(models.Wallet).all()
        wallet_summary = "\n".join([f"- {w.name} ({w.type}): ₦{w.balance:,}" for w in wallets]) or "No wallets."
        goals = db.query(models.Goal).filter(models.Goal.achieved == False).all()
        goal_summary = "\n".join([f"- {g.name}: ₦{g.price_min:,}–₦{g.price_max or g.price_min:,}" for g in goals]) or "No active goals."

        prompt = Prompts.get_affordability_prompt(request.query, wallet_summary, goal_summary)
        messages = [{"role": "user", "content": prompt}]
        answer = await LLMProvider.generate_completion(messages=messages, temperature=0.4, max_tokens=512)
        return schemas.CanIAffordResponse(answer=answer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
