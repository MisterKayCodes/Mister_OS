from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from .base import BaseResponse

class LoginRequest(BaseModel):
    password: str
    device_name: str

class LoginResponse(BaseModel):
    token: str

class AuthSessionResponse(BaseResponse):
    id: int
    device_name: str
    ip_address: Optional[str] = None
    created_at: datetime
    last_active: datetime
