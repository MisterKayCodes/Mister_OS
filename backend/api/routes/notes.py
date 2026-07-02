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

import datetime

def parse_date_tag(date_str: str) -> datetime.datetime:
    date_str = date_str.lower().strip()
    now = datetime.datetime.now()
    if date_str == "today":
        return now
    elif date_str == "yesterday":
        return now - datetime.timedelta(days=1)
    
    days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    if date_str in days:
        target_day = days.index(date_str)
        current_day = now.weekday()
        diff = current_day - target_day
        if diff <= 0:
            diff += 7
        return now - datetime.timedelta(days=diff)
        
    try:
        return datetime.datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        return now

def parse_finance_commands(content: str, note_id: int, db: Session):
    # Fetch existing transactions to preserve their dates if they haven't changed
    existing_txs = db.query(models.Transaction).filter(models.Transaction.note_id == note_id).all()
    existing_pool = list(existing_txs)
    
    # Delete old transactions, we will recreate them
    db.query(models.Transaction).filter(models.Transaction.note_id == note_id).delete()
    
    prefix_pattern = r"^\s*/(spend|income|save|owe|paid-back)\s+(\$?)(\d+(?:\.\d+)?)\s+(.*)$"
    usd_rate = None
    
    for line in content.split('\n'):
        match = re.match(prefix_pattern, line, re.IGNORECASE)
        if match:
            cmd = match.group(1).lower()
            is_usd = match.group(2) == '$'
            amount = float(match.group(3))
            rest_of_line = match.group(4).strip()
            
            tag = "uncategorized"
            date_tag = None
            desc = rest_of_line
            
            # Extract #tag and @date from the end of the line in any order
            while True:
                end_match = re.search(r"\s+(?:#(\w+)|@([\w-]+))$", desc)
                if not end_match:
                    break
                if end_match.group(1):
                    tag = end_match.group(1).lower()
                elif end_match.group(2):
                    date_tag = end_match.group(2).lower()
                desc = desc[:end_match.start()].strip()
            
            tx_type = "expense"
            if cmd == "income": tx_type = "income"
            elif cmd == "save": tx_type = "save"
            elif cmd in ["owe", "paid-back"]: continue
            
            rate = 1.0
            naira_amt = int(amount)
            if is_usd:
                if not usd_rate:
                    try:
                        res = httpx.get("https://open.er-api.com/v6/latest/USD", timeout=5.0)
                        usd_rate = res.json().get("rates", {}).get("NGN", 1500.0)
                    except Exception:
                        usd_rate = 1500.0
                rate = usd_rate
                naira_amt = int(amount * rate)
                
            tx_date = datetime.datetime.now()
            if date_tag:
                tx_date = parse_date_tag(date_tag)
            else:
                # Try to find a matching existing transaction to preserve its date
                match_idx = -1
                for i, ex_tx in enumerate(existing_pool):
                    if ex_tx.type == tx_type and ex_tx.amount_naira == naira_amt and ex_tx.description == desc and ex_tx.category == tag:
                        match_idx = i
                        break
                if match_idx >= 0:
                    matched_tx = existing_pool.pop(match_idx)
                    tx_date = matched_tx.date
                
            db_tx = models.Transaction(
                type=tx_type,
                amount_naira=naira_amt,
                original_amount=amount if is_usd else None,
                original_currency="USD" if is_usd else "NGN",
                exchange_rate=rate,
                description=desc,
                category=tag,
                date=tx_date,
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
