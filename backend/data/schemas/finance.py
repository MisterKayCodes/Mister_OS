from pydantic import BaseModel
from typing import Optional, List
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
    tags: Optional[str] = None
    time: Optional[str] = None
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

class LoanInstallmentResponse(BaseResponse):
    id: int
    amount_due: int
    due_date: datetime
    status: str

class LoanResponse(BaseResponse):
    id: int
    title: str
    principal_amount: int
    repayment_amount: int
    payment_type: str
    amount_paid: int
    settled: bool
    wallet_id: Optional[int] = None
    created_at: datetime
    installments: List[LoanInstallmentResponse] = []

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
