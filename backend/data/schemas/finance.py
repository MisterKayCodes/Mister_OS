from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from .base import BaseResponse

class TransactionResponse(BaseResponse):
    id: int
    type: str
    amount_naira: int
    original_amount: Optional[float] = None
    original_currency: str
    description: str
    category: str
    date: datetime

class WalletResponse(BaseResponse):
    id: int
    name: str
    type: str
    balance: int
    color: str

class GoalResponse(BaseResponse):
    id: int
    name: str
    price_min: int
    price_max: Optional[int] = None
    wallet_id: Optional[int] = None
    achieved: bool

class DebtResponse(BaseResponse):
    id: int
    direction: str
    person: str
    amount: int
    description: str
    settled: bool
    date: datetime

class SubscriptionBase(BaseModel):
    name: str
    amount: int
    cycle: str
    next_due_date: datetime
    wallet_id: Optional[int] = None
    auto_deduct: Optional[bool] = False

class SubscriptionResponse(SubscriptionBase, BaseResponse):
    id: int

class FinanceInsightsRequest(BaseModel):
    pass

class FinanceInsightsResponse(BaseModel):
    insights: str

class CanIAffordRequest(BaseModel):
    query: str

class CanIAffordResponse(BaseModel):
    answer: str

class VendorBase(BaseModel):
    name: str

class VendorResponse(VendorBase, BaseResponse):
    id: int

class ProductBase(BaseModel):
    name: str
    category: Optional[str] = "uncategorized"

class ProductResponse(ProductBase, BaseResponse):
    id: int

class PriceLogCreate(BaseModel):
    product_id: int
    vendor_id: int
    price: int

class PriceLogResponse(PriceLogCreate, BaseResponse):
    id: int
    date: datetime

class PriceDbItem(BaseModel):
    product: ProductResponse
    latest_price: int
    latest_vendor: VendorResponse
    previous_price: Optional[int] = None
    price_changed_date: Optional[datetime] = None
