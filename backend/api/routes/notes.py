# Rule: Max 200 lines per file — split if exceeded
# MOUTH: Notes API Routes

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from data import models, schemas, database
from api.dependencies import get_master_token

router = APIRouter(prefix="/api/notes", tags=["Notes"])

@router.post("/", response_model=schemas.NoteResponse)
def create_note(note: schemas.NoteCreate, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    # Auto-generate title if missing
    title = note.title
    if not title or title.strip() == "":
        first_line = note.content.split("\n")[0] if note.content else ""
        title = first_line[:30] if first_line else "Untitled Note"
        
    db_note = models.Note(title=title, content=note.content)
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note

@router.get("/", response_model=List[schemas.NoteResponse])
def read_notes(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    notes = db.query(models.Note).order_by(models.Note.updated_at.desc()).offset(skip).limit(limit).all()
    return notes

@router.get("/{note_id}", response_model=schemas.NoteResponse)
def read_note(note_id: int, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    note = db.query(models.Note).filter(models.Note.id == note_id).first()
    if note is None:
        raise HTTPException(status_code=404, detail="Note not found")
    return note

@router.put("/{note_id}", response_model=schemas.NoteResponse)
def update_note(note_id: int, note_update: schemas.NoteUpdate, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    db_note = db.query(models.Note).filter(models.Note.id == note_id).first()
    if db_note is None:
        raise HTTPException(status_code=404, detail="Note not found")
        
    db_note.content = note_update.content
    if note_update.title:
        db_note.title = note_update.title
        
    db.commit()
    db.refresh(db_note)
    return db_note
