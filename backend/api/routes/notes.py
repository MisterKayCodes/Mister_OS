from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from data import models, schemas, database, vector
from api.dependencies import get_master_token
from services.note_service import NoteService

router = APIRouter(prefix="/api/notes", tags=["Notes"])

@router.post("/", response_model=schemas.NoteResponse)
def create_note(note: schemas.NoteCreate, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    return NoteService.create_note(db, note.title, note.content, getattr(note, 'folder_id', None))

@router.get("/", response_model=List[schemas.NoteResponse])
def read_notes(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    return db.query(models.Note).order_by(models.Note.updated_at.desc()).offset(skip).limit(limit).all()

@router.get("/count")
def count_notes(db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    from sqlalchemy import func
    count = db.query(func.count(models.Note.id)).scalar()
    return {"count": count}

# --- Folders ---
@router.get("/folders", response_model=List[schemas.FolderResponse])
def get_folders(db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    return db.query(models.Folder).order_by(models.Folder.name.asc()).all()

@router.post("/folders", response_model=schemas.FolderResponse)
def create_folder(folder: schemas.FolderBase, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    db_folder = db.query(models.Folder).filter(models.Folder.name.ilike(folder.name)).first()
    if db_folder: raise HTTPException(status_code=400, detail="Folder already exists")
    db_folder = models.Folder(name=folder.name)
    db.add(db_folder)
    db.commit()
    db.refresh(db_folder)
    return db_folder

@router.delete("/folders/{folder_id}")
def delete_folder(folder_id: int, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    folder = db.query(models.Folder).filter(models.Folder.id == folder_id).first()
    if not folder: raise HTTPException(status_code=404, detail="Folder not found")
    
    notes = db.query(models.Note).filter(models.Note.folder_id == folder_id).all()
    for n in notes:
        n.folder_id = None
        
    db.delete(folder)
    db.commit()
    return {"message": "Folder deleted"}

@router.get("/{note_id}", response_model=schemas.NoteResponse)
def read_note(note_id: int, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    note = db.query(models.Note).filter(models.Note.id == note_id).first()
    if note is None:
        raise HTTPException(status_code=404, detail="Note not found")
    return note

@router.put("/{note_id}", response_model=schemas.NoteResponse)
def update_note(note_id: int, note_update: schemas.NoteUpdate, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    updated_note = NoteService.update_note(db, note_id, note_update.content, note_update.title, getattr(note_update, 'folder_id', None))
    if not updated_note:
        raise HTTPException(status_code=404, detail="Note not found")
    return updated_note

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
                # Remove from vector DB (silently ignore if note was never indexed)
                vector.notes_collection.delete(where={"note_id": note_id})
            except Exception:
                pass
            db.delete(db_note)
    db.commit()
    return {"message": f"Deleted {len(req.note_ids)} notes"}

@router.post("/move-bulk")
def move_notes_bulk(req: schemas.BulkMoveRequest, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    db.query(models.Note).filter(models.Note.id.in_(req.note_ids)).update({models.Note.folder_id: req.folder_id}, synchronize_session=False)
    db.commit()
    return {"message": f"Moved {len(req.note_ids)} notes"}

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
