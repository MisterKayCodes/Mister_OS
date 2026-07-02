# Rule: Max 200 lines per file — split if exceeded
# MOUTH: AI Chat Analyzer Routes

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import os
import httpx
from api.dependencies import get_master_token
from data import database, models, schemas, vector

router = APIRouter(prefix="/api/ai", tags=["AI"])

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

class ChatAnalysisRequest(BaseModel):
    chat_log: str

class ChatAnalysisResponse(BaseModel):
    analysis: str

class TitleGenerateRequest(BaseModel):
    content: str

class TitleGenerateResponse(BaseModel):
    title: str

@router.post("/generate-title", response_model=TitleGenerateResponse)
async def generate_title(request: TitleGenerateRequest, token: str = Depends(get_master_token)):
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured.")
    prompt = f"""Generate a short title (5-8 words max) for this note. Return ONLY the title, no quotes, no punctuation at end.\n\nNote:\n{request.content[:600]}"""
    headers = {"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"}
    payload = {"model": "llama-3.1-8b-instant", "messages": [{"role": "user", "content": prompt}], "temperature": 0.3, "max_tokens": 20}
    async with httpx.AsyncClient() as client:
        try:
            res = await client.post(GROQ_API_URL, headers=headers, json=payload, timeout=15.0)
            res.raise_for_status()
            title = res.json()["choices"][0]["message"]["content"].strip().strip('"').strip("'")
            return TitleGenerateResponse(title=title)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze-chat", response_model=ChatAnalysisResponse)
async def analyze_chat(request: ChatAnalysisRequest, token: str = Depends(get_master_token)):
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured. Ensure .env is loaded.")
        
    prompt = f"""
    You are an expert sales and CRM analyst.
    Analyze the following Telegram chat log between me (the seller) and a prospect.
    Identify:
    1. Where the pitch went wrong (if applicable).
    2. What I did well.
    3. Actionable advice for the next pitch.
    
    Keep the response concise and formatted nicely in Markdown.
    
    Chat Log:
    {request.chat_log}
    """
    
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.5,
        "max_tokens": 1024
    }
    
    async with httpx.AsyncClient() as client:
        try:
            print(f"Sending request to Groq API with model: {payload['model']}")
            response = await client.post(GROQ_API_URL, headers=headers, json=payload, timeout=30.0)
            
            if response.status_code != 200:
                print(f"Groq API Error: {response.status_code} - {response.text}")
                
            response.raise_for_status()
            data = response.json()
            analysis = data["choices"][0]["message"]["content"]
            return ChatAnalysisResponse(analysis=analysis)
        except Exception as e:
            print(f"Exception during Groq call: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Groq API Error: {str(e)}")

@router.post("/omni-chat", response_model=schemas.ChatMessageResponse)
async def omni_chat(request: schemas.OmniChatRequest, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured.")

    # 1. Retrieve Context from Vector DB
    relevant_notes = vector.query_relevant_notes(request.message, n_results=3)
    context_text = "\n\n".join(relevant_notes) if relevant_notes else "No relevant notes found."
    
    # 2. Build the System Prompt
    system_prompt = f"""You are Mister, an advanced AI Assistant operating as a 'Second Brain'.
    You have access to the user's personal notes. Use the provided Context from their notes to answer their questions.
    If the context does not contain the answer, rely on your general knowledge but mention you couldn't find it in their notes.
    
    CONTEXT FROM USER'S NOTES:
    {context_text}
    """
    
    # 3. Handle Chat Session History
    if not request.session_id:
        # Create new session
        db_session = models.ChatSession(title=request.message[:30] + "...")
        db.add(db_session)
        db.commit()
        db.refresh(db_session)
        session_id = db_session.id
    else:
        session_id = request.session_id
        
    # Save User Message
    db_user_msg = models.ChatMessage(session_id=session_id, role="user", content=request.message)
    db.add(db_user_msg)
    db.commit()
    
    # Fetch previous messages for context window (last 10)
    history = db.query(models.ChatMessage).filter(models.ChatMessage.session_id == session_id).order_by(models.ChatMessage.id.asc()).limit(10).all()
    
    messages = [{"role": "system", "content": system_prompt}]
    for msg in history:
        messages.append({"role": msg.role, "content": msg.content})
        
    # 4. Call Groq
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 1024
    }
    
    async with httpx.AsyncClient() as client:
        try:
            print(f"Sending Omni-Chat request with {len(relevant_notes)} context chunks...")
            response = await client.post(GROQ_API_URL, headers=headers, json=payload, timeout=30.0)
            response.raise_for_status()
            data = response.json()
            ai_reply = data["choices"][0]["message"]["content"]
            
            # Save Assistant Message
            db_ai_msg = models.ChatMessage(session_id=session_id, role="assistant", content=ai_reply)
            db.add(db_ai_msg)
            db.commit()
            db.refresh(db_ai_msg)
            
            return schemas.ChatMessageResponse(
                id=db_ai_msg.id,
                role=db_ai_msg.role,
                content=db_ai_msg.content,
                created_at=db_ai_msg.created_at
            )
        except Exception as e:
            print(f"Exception in Omni-Chat: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

