from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from data import database, models
from api.dependencies import get_master_token
from services.knowledge_service import KnowledgeService

router = APIRouter(prefix="/api/knowledge", tags=["Knowledge"])

class YouTubeIngestRequest(BaseModel):
    url: str

class IngestResponse(BaseModel):
    note_id: int
    title: str
    word_count: int

@router.post("/youtube", response_model=IngestResponse)
def ingest_youtube(req: YouTubeIngestRequest, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    try:
        result = KnowledgeService.ingest_youtube(req.url, db)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/transcripts")
def get_transcripts(db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    # Find the YouTube Transcripts folder
    folder = db.query(models.Folder).filter(models.Folder.name.ilike("YouTube Transcripts")).first()
    if not folder:
        return []
    
    # Return all notes in this folder
    notes = db.query(models.Note).filter(models.Note.folder_id == folder.id).order_by(models.Note.updated_at.desc()).all()
    
    results = []
    for note in notes:
        # Calculate approximate word count
        word_count = len(note.content.split()) if note.content else 0
        results.append({
            "id": note.id,
            "title": note.title,
            "created_at": note.created_at,
            "word_count": word_count
        })
    return results
