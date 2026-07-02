from sqlalchemy.orm import Session
from data.repository import NoteRepository
from services.finance_service import FinanceService
from data import vector
from data import models

class NoteService:
    @staticmethod
    def create_note(db: Session, title: str, content: str, folder_id: int = None) -> models.Note:
        # Auto-generate title if missing
        if not title or title.strip() == "":
            first_line = content.split("\n")[0] if content else ""
            title = first_line[:30] if first_line else "Untitled Note"
            
        note = NoteRepository.create(db, title, content, folder_id)
        
        # Parse finance commands
        FinanceService.sync_note_transactions(db, note.id, note.content)
        
        # Store in Vector DB for Omni-Brain
        vector.upsert_note_vectors(note.id, note.title, note.content)
        
        return note

    @staticmethod
    def update_note(db: Session, note_id: int, content: str = None, title: str = None, folder_id: int = None) -> models.Note:
        note = NoteRepository.get_by_id(db, note_id)
        if not note:
            return None
            
        if content is not None:
            note.content = content
        if title is not None:
            note.title = title
        if folder_id is not None:
            note.folder_id = folder_id
            
        NoteRepository.update(db, note)
        
        # Parse finance commands on update
        FinanceService.sync_note_transactions(db, note.id, note.content)
        
        # Update in Vector DB
        vector.upsert_note_vectors(note.id, note.title, note.content)
        
        return note
