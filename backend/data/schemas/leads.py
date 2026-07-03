from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from .base import BaseResponse

class LeadBase(BaseModel):
    username: str
    channel_username: Optional[str] = None
    status: Optional[str] = "Cold"
    score: Optional[str] = None
    auto_pilot: Optional[bool] = False

class LeadCreate(LeadBase):
    pass

class LeadUpdate(BaseModel):
    channel_username: Optional[str] = None
    status: Optional[str] = None
    score: Optional[str] = None
    auto_pilot: Optional[bool] = None

class LeadResponse(LeadBase, BaseResponse):
    id: int
    created_at: datetime
    updated_at: datetime

class LeadInteractionBase(BaseModel):
    lead_id: int
    role: str
    content: str
    is_draft: Optional[bool] = False

class LeadInteractionResponse(LeadInteractionBase, BaseResponse):
    id: int
    timestamp: datetime

class LeadSummaryBase(BaseModel):
    lead_id: int
    summary: str
    message_count: int

class LeadSummaryResponse(LeadSummaryBase, BaseResponse):
    id: int
    updated_at: datetime

class ChatTranscriptBase(BaseModel):
    transcript: str

class ChatTranscriptResponse(ChatTranscriptBase, BaseResponse):
    id: int
    lead_id: int
    scraped_at: datetime

class ScrapePitchingPayload(BaseModel):
    username: str
    profile_name: str
    status: str
    transcript: str
    first_contact_at: Optional[datetime] = None
    last_our_message_at: Optional[datetime] = None
    last_their_message_at: Optional[datetime] = None
    read_receipt_seen: bool = False
    follow_up_sent: bool = False

class AnalysisReportResponse(BaseResponse):
    id: int
    working_patterns: str
    killing_patterns: str
    pain_points: str
    top_openers: str
    created_at: datetime
