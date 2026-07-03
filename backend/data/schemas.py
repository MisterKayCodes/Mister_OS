from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class FolderBase(BaseModel):
    name: str

class FolderResponse(FolderBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

class NoteBase(BaseModel):
    title: Optional[str] = None
    content: str
    folder_id: Optional[int] = None

class NoteCreate(NoteBase):
    pass

class NoteUpdate(NoteBase):
    pass

class NoteResponse(NoteBase):
    id: int
    title: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ChatMessageBase(BaseModel):
    role: str
    content: str

class ChatMessageResponse(ChatMessageBase):
    id: int
    session_id: int
    created_at: datetime
    class Config:
        from_attributes = True

class ChatSessionResponse(BaseModel):
    id: int
    title: str
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

class OmniChatRequest(BaseModel):
    session_id: Optional[int] = None
    message: str

# --- AI Schemas ---
class ChatAnalysisRequest(BaseModel):
    chat_log: str

class ChatAnalysisResponse(BaseModel):
    analysis: str

class TitleGenerateRequest(BaseModel):
    content: str

class TitleGenerateResponse(BaseModel):
    title: str

# --- Notes Schemas ---
class BulkDeleteRequest(BaseModel):
    note_ids: List[int]

class BulkMoveRequest(BaseModel):
    note_ids: List[int]
    folder_id: Optional[int] = None

# --- Finance Schemas ---
class TransactionResponse(BaseModel):
    id: int
    type: str
    amount_naira: int
    original_amount: Optional[float] = None
    original_currency: str
    description: str
    category: str
    date: datetime
    class Config: from_attributes = True

class WalletResponse(BaseModel):
    id: int
    name: str
    type: str
    balance: int
    color: str
    class Config: from_attributes = True

class GoalResponse(BaseModel):
    id: int
    name: str
    price_min: int
    price_max: Optional[int] = None
    wallet_id: Optional[int] = None
    achieved: bool
    class Config: from_attributes = True

class DebtResponse(BaseModel):
    id: int
    direction: str
    person: str
    amount: int
    description: str
    settled: bool
    date: datetime
    class Config: from_attributes = True

# --- Finance AI Schemas ---
class FinanceInsightsRequest(BaseModel):
    pass  # No input needed; backend fetches data itself

class FinanceInsightsResponse(BaseModel):
    insights: str

class CanIAffordRequest(BaseModel):
    query: str

class CanIAffordResponse(BaseModel):
    answer: str

# --- Auth Schemas ---
class LoginRequest(BaseModel):
    password: str
    device_name: str

class LoginResponse(BaseModel):
    token: str

class AuthSessionResponse(BaseModel):
    id: int
    device_name: str
    ip_address: Optional[str] = None
    created_at: datetime
    last_active: datetime
    class Config: from_attributes = True

# --- Price DB Schemas ---
class VendorBase(BaseModel):
    name: str

class VendorResponse(VendorBase):
    id: int
    class Config: from_attributes = True

class ProductBase(BaseModel):
    name: str
    category: Optional[str] = "uncategorized"

class ProductResponse(ProductBase):
    id: int
    class Config: from_attributes = True

class PriceLogCreate(BaseModel):
    product_id: int
    vendor_id: int
    price: int

class PriceLogResponse(PriceLogCreate):
    id: int
    date: datetime
    class Config: from_attributes = True

class PriceDbItem(BaseModel):
    product: ProductResponse
    latest_price: int
    latest_vendor: VendorResponse
    previous_price: Optional[int] = None
    price_changed_date: Optional[datetime] = None

# --- Lead Schemas ---
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

class LeadResponse(LeadBase):
    id: int
    created_at: datetime
    updated_at: datetime
    class Config: from_attributes = True

class HuntedChannelBase(BaseModel):
    username: str
    title: Optional[str] = None

class HuntedChannelResponse(HuntedChannelBase):
    id: int
    scanned_at: datetime
    class Config: from_attributes = True

class LeadInteractionBase(BaseModel):
    lead_id: int
    role: str
    content: str
    is_draft: Optional[bool] = False

class LeadInteractionResponse(LeadInteractionBase):
    id: int
    timestamp: datetime
    class Config: from_attributes = True

class LeadSummaryBase(BaseModel):
    lead_id: int
    summary: str
    message_count: int

class LeadSummaryResponse(LeadSummaryBase):
    id: int
    updated_at: datetime
    class Config: from_attributes = True

# --- Hunt & Outreach Schemas ---
class ScrapedChannelResponse(BaseModel):
    id: int
    tg_id: str
    username: Optional[str] = None
    title: Optional[str] = None
    members_count: Optional[int] = None
    source_channel: Optional[str] = None
    status: str
    scanned_at: datetime
    class Config: from_attributes = True

class AdminLeadResponse(BaseModel):
    id: int
    username: str
    channel_id: Optional[int] = None
    source: str
    status: str
    contacted_at: Optional[datetime] = None
    created_at: datetime
    class Config: from_attributes = True

class AdminLeadUpdate(BaseModel):
    username: Optional[str] = None
    status: Optional[str] = None

class AdminLeadCreate(BaseModel):
    username: str
    channel_id: Optional[int] = None
    source: Optional[str] = "manual"

class OutreachLogResponse(BaseModel):
    id: int
    admin_lead_id: int
    message_variant: Optional[int] = None
    content: str
    sent_at: datetime
    class Config: from_attributes = True

class OutreachTemplateBase(BaseModel):
    content: str

class OutreachTemplateResponse(OutreachTemplateBase):
    id: int
    created_at: datetime
    class Config: from_attributes = True

class TemplateGenerateRequest(BaseModel):
    chat_transcript: str

class CrmSettingsResponse(BaseModel):
    id: int
    boss_alert_username: str
    outreach_active: bool
    min_delay_minutes: int
    max_delay_minutes: int
    next_outreach_run: Optional[datetime] = None
    class Config: from_attributes = True

class CrmSettingsUpdate(BaseModel):
    boss_alert_username: Optional[str] = None
    outreach_active: Optional[bool] = None
    min_delay_minutes: Optional[int] = None
    max_delay_minutes: Optional[int] = None
    next_outreach_run: Optional[datetime] = None

class OutreachStatsResponse(BaseModel):
    sent_today: int
    sent_this_week: int
    total_fresh: int
    outreach_active: bool
    next_run: Optional[datetime] = None

class ChatTranscriptBase(BaseModel):
    transcript: str

class ChatTranscriptResponse(ChatTranscriptBase):
    id: int
    lead_id: int
    scraped_at: datetime
    class Config: from_attributes = True

class ScrapePitchingPayload(BaseModel):
    username: str
    profile_name: str
    status: str
    transcript: str
