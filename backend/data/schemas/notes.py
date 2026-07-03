from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from .base import BaseResponse

class FolderBase(BaseModel):
    name: str

class FolderResponse(FolderBase, BaseResponse):
    id: int
    created_at: datetime

class NoteBase(BaseModel):
    title: Optional[str] = None
    content: str
    folder_id: Optional[int] = None

class NoteCreate(NoteBase):
    pass

class NoteUpdate(NoteBase):
    pass

class NoteResponse(NoteBase, BaseResponse):
    id: int
    title: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class BulkDeleteRequest(BaseModel):
    note_ids: List[int]

class BulkMoveRequest(BaseModel):
    note_ids: List[int]
    folder_id: Optional[int] = None
