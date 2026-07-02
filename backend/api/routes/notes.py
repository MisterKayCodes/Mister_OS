# Rule: Max 200 lines per file — split if exceeded
# MOUTH: Notes API Routes

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
import re
from data import models, schemas, database, vector
from api.dependencies import get_master_token

router = APIRouter(prefix="/api/notes", tags=["Notes"])

class BulkDeleteRequest(BaseModel):
    note_ids: List[int]

def parse_and_save_expenses(content: str, note_id: int, db: Session):
    # Find all lines starting with /spend
    # Format: /spend 1000 Geisha at Mama Tochi
    pattern = r"^\s*/spend\s+(\d+(?:\.\d+)?)\s+(.+)$"
    
    # First, clear old expenses for this note to avoid duplicates on update
    db.query(models.Expense).filter(models.Expense.note_id == note_id).delete()
    
    for line in content.split('\n'):
        match = re.match(pattern, line, re.IGNORECASE)
        if match:
            amount = int(float(match.group(1)))
            description = match.group(2).strip()
            db_expense = models.Expense(amount=amount, description=description, note_id=note_id)
            db.add(db_expense)
    db.commit()

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
    
    # Parse expenses
    parse_and_save_expenses(note.content, db_note.id, db)
    
    # Store in Vector DB for Omni-Brain
    vector.upsert_note_vectors(db_note.id, db_note.title, db_note.content)
    
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
    
    # Parse expenses on update
    parse_and_save_expenses(note_update.content, db_note.id, db)
    
    # Update in Vector DB for Omni-Brain
    vector.upsert_note_vectors(db_note.id, db_note.title, db_note.content)
    
    return db_note

@router.get("/expenses/all")
def get_all_expenses(db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    expenses = db.query(models.Expense).order_by(models.Expense.created_at.desc()).all()
    # Also fetch note titles for context
    result = []
    for exp in expenses:
        note = db.query(models.Note).filter(models.Note.id == exp.note_id).first()
        result.append({
            "id": exp.id,
            "amount": exp.amount,
            "description": exp.description,
            "date": exp.created_at,
            "note_title": note.title if note else "Unknown Note"
        })
    return result

@router.post("/delete-bulk")
def delete_notes_bulk(req: BulkDeleteRequest, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    for note_id in req.note_ids:
        db_note = db.query(models.Note).filter(models.Note.id == note_id).first()
        if db_note:
            db.query(models.Expense).filter(models.Expense.note_id == note_id).delete()
            try:
                vector.notes_collection.delete(where={"note_id": note_id})
            except Exception:
                pass
            db.delete(db_note)
    db.commit()
    return {"deleted": len(req.note_ids)}

@router.delete("/{note_id}")
def delete_note(note_id: int, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    db_note = db.query(models.Note).filter(models.Note.id == note_id).first()
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
    db.query(models.Expense).filter(models.Expense.note_id == note_id).delete()
    try:
        vector.notes_collection.delete(where={"note_id": note_id})
    except Exception:
        pass
    db.delete(db_note)
    db.commit()
    return {"message": "Note deleted"}
