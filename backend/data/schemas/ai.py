from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from .base import BaseResponse

class ChatMessageBase(BaseModel):
    role: str
    content: str

class ChatMessageResponse(ChatMessageBase, BaseResponse):
    id: int
    session_id: int
    created_at: datetime

class ChatSessionResponse(BaseResponse):
    id: int
    title: str
    created_at: datetime
    updated_at: datetime

class OmniChatRequest(BaseModel):
    session_id: Optional[int] = None
    message: str

class ChatAnalysisRequest(BaseModel):
    chat_log: str

class ChatAnalysisResponse(BaseModel):
    analysis: str

class TitleGenerateRequest(BaseModel):
    content: str

class TitleGenerateResponse(BaseModel):
    title: str
