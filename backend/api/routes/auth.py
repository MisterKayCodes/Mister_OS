from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from data import database, models, schemas
from api.dependencies import get_master_token
from typing import List
import os
import uuid

router = APIRouter(prefix="/api/auth", tags=["Auth"])

# We reload from os.getenv directly here for the root password validation
MASTER_TOKEN = os.getenv("MASTER_TOKEN", "mister_os_secret_token_123")

@router.post("/login", response_model=schemas.LoginResponse)
def login(req: schemas.LoginRequest, request: Request, db: Session = Depends(database.get_db)):
    if req.password != MASTER_TOKEN:
        raise HTTPException(status_code=403, detail="Invalid Master Password")
    
    # Generate a unique session token
    session_token = str(uuid.uuid4())
    
    # Grab IP address
    ip_addr = request.client.host if request.client else None
    
    # Save to SQLite
    session_db = models.AuthSession(
        token=session_token,
        device_name=req.device_name,
        ip_address=ip_addr
    )
    db.add(session_db)
    db.commit()
    
    return {"token": session_token}

@router.get("/sessions", response_model=List[schemas.AuthSessionResponse])
def get_sessions(db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    return db.query(models.AuthSession).order_by(models.AuthSession.last_active.desc()).all()

@router.delete("/sessions/{session_id}")
def delete_session(session_id: int, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    session_to_delete = db.query(models.AuthSession).filter(models.AuthSession.id == session_id).first()
    if session_to_delete:
        db.delete(session_to_delete)
        db.commit()
    return {"message": "Session terminated"}
