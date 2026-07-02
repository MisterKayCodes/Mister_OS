from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class NoteBase(BaseModel):
    title: Optional[str] = None
    content: str

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
