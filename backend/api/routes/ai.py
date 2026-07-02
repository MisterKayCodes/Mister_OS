# Rule: Max 200 lines per file — split if exceeded
# MOUTH: AI Chat Analyzer Routes

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import os
import httpx
from api.dependencies import get_master_token

router = APIRouter(prefix="/api/ai", tags=["AI"])

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

class ChatAnalysisRequest(BaseModel):
    chat_log: str

class ChatAnalysisResponse(BaseModel):
    analysis: str

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
