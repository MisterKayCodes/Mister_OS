from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from data import models, schemas, database
from api.dependencies import get_master_token
from services.sales_service import SalesService

router = APIRouter(prefix="/api/leads", tags=["Leads"])

@router.get("/", response_model=List[schemas.LeadResponse])
def get_leads(db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    return db.query(models.Lead).order_by(models.Lead.updated_at.desc()).all()

@router.post("/", response_model=schemas.LeadResponse)
def create_lead(req: schemas.LeadCreate, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    lead = db.query(models.Lead).filter(models.Lead.username == req.username).first()
    if lead: return lead
    lead = models.Lead(**req.dict())
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead

@router.put("/{lead_id}", response_model=schemas.LeadResponse)
def update_lead(lead_id: int, req: schemas.LeadUpdate, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    lead = db.query(models.Lead).filter(models.Lead.id == lead_id).first()
    if not lead: raise HTTPException(status_code=404, detail="Lead not found")
    
    update_data = req.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(lead, key, value)
        
    db.commit()
    db.refresh(lead)
    return lead

@router.post("/webhook")
async def telegram_webhook(payload: dict, db: Session = Depends(database.get_db)):
    """
    Webhook called by the Telegram Microservice when a new message arrives.
    """
    username = payload.get("username")
    message = payload.get("message")
    role = payload.get("role", "user")
    
    if username and message:
        await SalesService.process_incoming_message(db, username, message, role)
        return {"status": "processed"}
    return {"status": "ignored"}

@router.get("/drafts/pending", response_model=List[schemas.LeadInteractionResponse])
def get_pending_drafts(db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    return db.query(models.LeadInteraction).filter(models.LeadInteraction.is_draft == True).order_by(models.LeadInteraction.timestamp.desc()).all()

@router.post("/drafts/{interaction_id}/approve")
async def approve_draft(interaction_id: int, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    interaction = db.query(models.LeadInteraction).filter(models.LeadInteraction.id == interaction_id).first()
    if not interaction or not interaction.is_draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    
    # Mark as no longer a draft
    interaction.is_draft = False
    db.commit()
    db.refresh(interaction)
    
    # TODO: Dispatch to Telegram Microservice here via HTTP request
    # requests.post("http://localhost:8001/send", json={"lead_id": interaction.lead_id, "content": interaction.content})
    
    return {"status": "approved", "interaction": interaction}

@router.put("/drafts/{interaction_id}")
def update_draft(interaction_id: int, req: schemas.LeadInteractionBase, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    interaction = db.query(models.LeadInteraction).filter(models.LeadInteraction.id == interaction_id).first()
    if not interaction or not interaction.is_draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    
    interaction.content = req.content
    db.commit()
    db.refresh(interaction)
    return interaction

@router.delete("/drafts/{interaction_id}")
def delete_draft(interaction_id: int, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    interaction = db.query(models.LeadInteraction).filter(models.LeadInteraction.id == interaction_id).first()
    if not interaction or not interaction.is_draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    
    db.delete(interaction)
    db.commit()
    return {"status": "deleted"}
