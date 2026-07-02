from pydantic import BaseModel
from typing import Optional
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
