from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from .base import BaseResponse

class LifeUserProgressResponse(BaseResponse):
    id: int
    total_xp: float
    silver_keys: int
    gold_keys: int
    platinum_keys: int
    current_streak: int
    last_action_date: Optional[datetime]

class LifeTaskDefCreate(BaseModel):
    name: str
    category: str
    base_xp: float = 0.0
    target_minutes: Optional[int] = None
    is_timed: bool = True
    fast_bonus_xp: float = 0.0
    order_index: int = 0

class LifeTaskDefUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    base_xp: Optional[float] = None
    target_minutes: Optional[int] = None
    is_timed: Optional[bool] = None
    fast_bonus_xp: Optional[float] = None
    order_index: Optional[int] = None

class LifeTaskDefResponse(BaseResponse):
    id: int
    name: str
    category: str
    base_xp: float
    target_minutes: Optional[int]
    is_timed: bool
    fast_bonus_xp: float
    order_index: int

class LifeTaskSessionCreate(BaseModel):
    task_def_id: int
    duration_minutes: float
    xp_earned: float
    is_completed: bool = True

class LifeTaskSessionResponse(BaseResponse):
    id: int
    task_def_id: int
    start_time: datetime
    end_time: Optional[datetime]
    duration_minutes: float
    xp_earned: float
    is_completed: bool
    date_logged: datetime
    task_def: Optional[LifeTaskDefResponse] = None

class LifeRewardCreate(BaseModel):
    name: str
    cost_keys: int = 1
    key_type: str
    session_minutes: int = 0
    order_index: int = 0

class LifeRewardResponse(BaseResponse):
    id: int
    name: str
    cost_keys: int
    key_type: str
    session_minutes: int
    order_index: int

class LifeRewardUnlockCreate(BaseModel):
    reward_id: int
    key_type_spent: str
    keys_spent: int = 1

class LifeRewardUnlockResponse(BaseResponse):
    id: int
    reward_id: int
    key_type_spent: str
    keys_spent: int
    unlocked_at: datetime
