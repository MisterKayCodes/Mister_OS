from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from .base import BaseResponse

class ScrapedChannelResponse(BaseResponse):
    id: int
    tg_id: str
    username: Optional[str] = None
    title: Optional[str] = None
    members_count: Optional[int] = None
    source_channel: Optional[str] = None
    status: str
    scanned_at: datetime

class AdminLeadResponse(BaseResponse):
    id: int
    username: str
    channel_id: Optional[int] = None
    source: str
    status: str
    contacted_at: Optional[datetime] = None
    created_at: datetime

class AdminLeadUpdate(BaseModel):
    username: Optional[str] = None
    status: Optional[str] = None

class AdminLeadCreate(BaseModel):
    username: str
    channel_id: Optional[int] = None
    source: Optional[str] = "manual"

class HuntedChannelBase(BaseModel):
    username: str
    title: Optional[str] = None

class HuntedChannelResponse(HuntedChannelBase, BaseResponse):
    id: int
    scanned_at: datetime

class OutreachLogResponse(BaseResponse):
    id: int
    admin_lead_id: int
    message_variant: Optional[int] = None
    content: str
    sent_at: datetime

class OutreachTemplateBase(BaseModel):
    content: str

class OutreachTemplateResponse(OutreachTemplateBase, BaseResponse):
    id: int
    created_at: datetime

class TemplateGenerateRequest(BaseModel):
    chat_transcript: str

class CrmSettingsResponse(BaseResponse):
    id: int
    boss_alert_username: str
    outreach_active: bool
    min_delay_minutes: int
    max_delay_minutes: int
    next_outreach_run: Optional[datetime] = None

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
