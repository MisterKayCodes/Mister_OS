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

import httpx

def parse_finance_commands(content: str, note_id: int, db: Session):
    # Clear old transactions for this note to prevent duplicates
    db.query(models.Transaction).filter(models.Transaction.note_id == note_id).delete()
    
    # Patterns
    # /spend [amount] [desc] #[tag]
    # /income [amount] [desc] #[tag]
    pattern = r"^\s*/(spend|income|save|owe|paid-back)\s+(\$?)(\d+(?:\.\d+)?)\s+(.+?)(?:\s+#(\w+))?\s*$"
    
    usd_rate = None
    
    for line in content.split('\n'):
        match = re.match(pattern, line, re.IGNORECASE)
        if match:
            cmd = match.group(1).lower()
            is_usd = match.group(2) == '$'
            amount = float(match.group(3))
            desc = match.group(4).strip()
            tag = match.group(5).lower() if match.group(5) else "uncategorized"
            
            # Map command to type
            tx_type = "expense"
            if cmd == "income": tx_type = "income"
            elif cmd == "save": tx_type = "save"
            elif cmd in ["owe", "paid-back"]: continue # Handled separately later if needed
            
            # USD Conversion
            rate = 1.0
            naira_amt = int(amount)
            if is_usd:
                if not usd_rate:
                    try:
                        res = httpx.get("https://open.er-api.com/v6/latest/USD", timeout=5.0)
                        usd_rate = res.json().get("rates", {}).get("NGN", 1500.0)
                    except Exception:
                        usd_rate = 1500.0 # Fallback
                rate = usd_rate
                naira_amt = int(amount * rate)
                
            db_tx = models.Transaction(
                type=tx_type,
                amount_naira=naira_amt,
                original_amount=amount if is_usd else None,
                original_currency="USD" if is_usd else "NGN",
                exchange_rate=rate,
                description=desc,
                category=tag,
                note_id=note_id
            )
            db.add(db_tx)
    
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
    
    # Parse finance commands
    parse_finance_commands(note.content, db_note.id, db)
    
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
    
    # Parse finance commands on update
    parse_finance_commands(note_update.content, db_note.id, db)
    
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
def delete_notes_bulk(req: schemas.BulkDeleteRequest, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
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
