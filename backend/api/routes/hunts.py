from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
from data import models, schemas, database
from api.dependencies import get_master_token
from providers.llm_provider import LLMProvider
import json
import subprocess
import os
import sys
router = APIRouter(prefix="/api/hunts", tags=["Hunts"])

def get_db():
    return database.get_db()

# --- Scraped Channels ---
@router.get("/channels", response_model=List[schemas.ScrapedChannelResponse])
def get_channels(db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    return db.query(models.ScrapedChannel).order_by(models.ScrapedChannel.scanned_at.desc()).all()

@router.post("/channels/webhook")
def ingest_channel(payload: dict, db: Session = Depends(database.get_db)):
    """Called by the hunt_worker to store a found channel."""
    tg_id = str(payload.get("tg_id", ""))
    if not tg_id:
        raise HTTPException(status_code=400, detail="tg_id required")

    existing = db.query(models.ScrapedChannel).filter(models.ScrapedChannel.tg_id == tg_id).first()
    if existing:
        return {"status": "already_exists", "id": existing.id}

    channel = models.ScrapedChannel(
        tg_id=tg_id,
        username=payload.get("username"),
        title=payload.get("title"),
        members_count=payload.get("members_count"),
        source_channel=payload.get("source_channel"),
        status="pending"
    )
    db.add(channel)
    db.commit()
    db.refresh(channel)
    return {"status": "created", "id": channel.id}

@router.delete("/channels/{channel_id}")
def delete_channel(channel_id: int, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    channel = db.query(models.ScrapedChannel).filter(models.ScrapedChannel.id == channel_id).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    db.delete(channel)
    db.commit()
    return {"status": "deleted"}

# --- Admin Leads ---
@router.get("/admins", response_model=List[schemas.AdminLeadResponse])
def get_admins(status: str = None, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    q = db.query(models.AdminLead)
    if status:
        q = q.filter(models.AdminLead.status == status)
    return q.order_by(models.AdminLead.created_at.desc()).all()

@router.post("/admins/webhook")
def ingest_admin(payload: dict, db: Session = Depends(database.get_db)):
    """Called by the hunt_worker when an admin username is found."""
    # 1 & 4. Normalise username (lowercase, no @)
    username = payload.get("username", "").strip().lstrip("@").lower()
    if not username:
        raise HTTPException(status_code=400, detail="username required")

    from sqlalchemy import func

    # 2 & 3. Blacklist check: if already in Lead table (any active/dead pipeline status), skip
    # We strip '@' from the db column in the query just in case it was saved with one
    existing_lead = db.query(models.Lead).filter(
        func.lower(func.replace(models.Lead.username, '@', '')) == username
    ).first()
    
    if existing_lead:
        return {"status": "blacklisted", "reason": f"Already in CRM pipeline as {existing_lead.status}"}

    # 3. Check AdminLead table comprehensively (case-insensitive)
    existing_admin = db.query(models.AdminLead).filter(
        func.lower(func.replace(models.AdminLead.username, '@', '')) == username
    ).first()
    
    if existing_admin:
        return {"status": "already_exists", "id": existing_admin.id, "current_status": existing_admin.status}

    # Lookup channel by tg_id if provided
    channel_id = payload.get("channel_id")
    channel_tg_id = payload.get("channel_tg_id")
    if channel_tg_id:
        ch = db.query(models.ScrapedChannel).filter(models.ScrapedChannel.tg_id == channel_tg_id).first()
        if ch:
            channel_id = ch.id

    source = payload.get("source", "description")
    status = "manual_review" if source == "manual" else "fresh"

    admin = models.AdminLead(
        username=username,
        channel_id=channel_id,
        source=source,
        status=status
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return {"status": "created", "id": admin.id}

@router.put("/admins/{admin_id}", response_model=schemas.AdminLeadResponse)
def update_admin(admin_id: int, req: schemas.AdminLeadUpdate, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    admin = db.query(models.AdminLead).filter(models.AdminLead.id == admin_id).first()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin lead not found")
    for k, v in req.dict(exclude_unset=True).items():
        setattr(admin, k, v)
    db.commit()
    db.refresh(admin)
    return admin

@router.post("/admins", response_model=schemas.AdminLeadResponse)
def create_admin_manual(req: schemas.AdminLeadCreate, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    """Manually add an admin lead from the UI."""
    username = req.username.strip().lstrip("@")
    existing = db.query(models.AdminLead).filter(models.AdminLead.username == username).first()
    if existing:
        return existing
    admin = models.AdminLead(username=username, channel_id=req.channel_id, source=req.source, status="fresh")
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin

@router.delete("/admins/{admin_id}")
def delete_admin_lead(admin_id: int, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    admin = db.query(models.AdminLead).filter(models.AdminLead.id == admin_id).first()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    db.delete(admin)
    db.commit()
    return {"status": "deleted"}

@router.post("/migrate-manual")
def migrate_manual_admins(db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    """One-off script to migrate old MANUAL: entries to the proper status and link channels."""
    admins = db.query(models.AdminLead).filter(models.AdminLead.username.like("MANUAL:%")).all()
    count = 0
    for admin in admins:
        # Move to manual review
        if admin.status == "fresh":
            admin.status = "manual_review"
        # Try to link channel
        if not admin.channel_id:
            channel_username = admin.username.replace("MANUAL:", "")
            ch = db.query(models.ScrapedChannel).filter(
                (models.ScrapedChannel.username == channel_username) | 
                (models.ScrapedChannel.tg_id == channel_username)
            ).first()
            if ch:
                admin.channel_id = ch.id
        count += 1
    db.commit()
    return {"migrated_count": count}

# --- CRM Settings ---
@router.get("/settings", response_model=schemas.CrmSettingsResponse)
def get_settings(db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    settings = db.query(models.CrmSettings).first()
    if not settings:
        settings = models.CrmSettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@router.put("/settings", response_model=schemas.CrmSettingsResponse)
def update_settings(req: schemas.CrmSettingsUpdate, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    settings = db.query(models.CrmSettings).first()
    if not settings:
        settings = models.CrmSettings()
        db.add(settings)
    for k, v in req.dict(exclude_unset=True).items():
        setattr(settings, k, v)
    db.commit()
    db.refresh(settings)
    return settings

# --- Outreach Logs & Templates ---
@router.get("/outreach/stats", response_model=schemas.OutreachStatsResponse)
def get_outreach_stats(db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    today = datetime.utcnow().replace(hour=0, minute=0, second=0)
    week_ago = datetime.utcnow() - timedelta(days=7)
    sent_today = db.query(models.OutreachLog).filter(models.OutreachLog.sent_at >= today).count()
    sent_week = db.query(models.OutreachLog).filter(models.OutreachLog.sent_at >= week_ago).count()
    fresh_count = db.query(models.AdminLead).filter(models.AdminLead.status == "fresh").count()
    settings = db.query(models.CrmSettings).first()
    return {
        "sent_today": sent_today,
        "sent_this_week": sent_week,
        "total_fresh": fresh_count,
        "outreach_active": settings.outreach_active if settings else False,
        "next_run": settings.next_outreach_run if settings else None
    }

@router.post("/outreach/log")
def log_outreach(payload: dict, db: Session = Depends(database.get_db)):
    """Called by the outreach worker after sending a message."""
    admin_lead_id = payload.get("admin_lead_id")
    content = payload.get("content", "")
    variant = payload.get("message_variant")
    if not admin_lead_id:
        raise HTTPException(status_code=400, detail="admin_lead_id required")

    log = models.OutreachLog(admin_lead_id=admin_lead_id, content=content, message_variant=variant)
    db.add(log)

    # Mark admin as contacted
    admin = db.query(models.AdminLead).filter(models.AdminLead.id == admin_lead_id).first()
    if admin:
        admin.status = "outreach_sent"
        admin.contacted_at = datetime.utcnow()

    db.commit()
    return {"status": "logged"}

@router.get("/templates", response_model=List[schemas.OutreachTemplateResponse])
def get_templates(db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    return db.query(models.OutreachTemplate).order_by(models.OutreachTemplate.id.desc()).all()

@router.post("/templates", response_model=schemas.OutreachTemplateResponse)
def create_template(req: schemas.OutreachTemplateBase, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    tpl = models.OutreachTemplate(content=req.content)
    db.add(tpl)
    db.commit()
    db.refresh(tpl)
    return tpl

@router.delete("/templates/{id}")
def delete_template(id: int, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    tpl = db.query(models.OutreachTemplate).filter(models.OutreachTemplate.id == id).first()
    if not tpl:
        raise HTTPException(status_code=404, detail="Template not found")
    db.delete(tpl)
    db.commit()
    return {"status": "deleted"}

@router.post("/templates/generate", response_model=List[schemas.OutreachTemplateResponse])
async def generate_templates(req: schemas.TemplateGenerateRequest, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    prompt = f"""You are an expert sales copywriter specializing in Telegram outreach.
The user has provided a transcript of their most successful past chats. Your job is to analyze their conversational style, tone, and value proposition, and generate 5 unique outreach templates that mimic this exact successful approach.

The templates will be sent as a FIRST CONTACT message to Telegram channel admins.
Keep them short, casual, and high-converting.
Use the exact placeholder {{name}} where the admin's username should go.

Here is the transcript of successful past chats:
{req.chat_transcript}

Return the response EXCLUSIVELY as a valid JSON array of 5 strings. Do not include any other text, markdown formatting, or explanation.
Example:
["template 1 {{name}}", "template 2 {{name}}"]"""

    try:
        messages = [{"role": "user", "content": prompt}]
        response_text = await LLMProvider.generate_completion(messages=messages, temperature=0.7)
        
        # Clean up possible markdown code blocks if the LLM ignores the instruction
        cleaned = response_text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

        import json
        templates_text = json.loads(cleaned)
        
        created_templates = []
        for text in templates_text:
            tpl = models.OutreachTemplate(content=text)
            db.add(tpl)
            created_templates.append(tpl)
            
        db.commit()
        for tpl in created_templates:
            db.refresh(tpl)
            
        return created_templates
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from pydantic import BaseModel

class ExtractAdminRequest(BaseModel):
    posts_text: str

@router.post("/extract_admin")
async def extract_admin(req: ExtractAdminRequest):
    prompt = f"""Read the following Telegram posts from a channel and find the username of the human admin or owner.
Ignore bot usernames (ending in bot) and ignore general links.
Return ONLY the username starting with @. If you cannot confidently find a human admin, return EXACTLY the string "NONE".

Posts:
{req.posts_text}"""
    try:
        messages = [{"role": "user", "content": prompt}]
        response_text = await LLMProvider.generate_completion(messages=messages, temperature=0.3)
        cleaned = response_text.strip()
        return {"username": cleaned}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/run")
def run_hunt_worker(payload: dict, token: str = Depends(get_master_token)):
    seed = payload.get("seed")
    limit = payload.get("limit", 10)
    if not seed:
        raise HTTPException(status_code=400, detail="Seed channel required")
    
    # Path to telegram_service directory
    telegram_service_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'telegram_service'))
    hunt_script = os.path.join(telegram_service_dir, "hunt_worker.py")
    
    # Log file setup
    logs_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'logs'))
    os.makedirs(logs_dir, exist_ok=True)
    log_file_path = os.path.join(logs_dir, "hunt_worker.log")
    
    try:
        # Open the log file and clear its previous contents
        log_file = open(log_file_path, "w")
        log_file.write(f"--- Starting Hunt for {seed} with limit {limit} ---\n")
        log_file.flush()
        
        # Popen runs the process in the background. We use sys.executable to ensure we use the venv python.
        # -u forces unbuffered output so logs appear instantly
        subprocess.Popen(
            [sys.executable, "-u", hunt_script, "--seed", seed, "--limit", str(limit)],
            cwd=telegram_service_dir,
            stdout=log_file,
            stderr=subprocess.STDOUT
        )
        return {"status": "started", "message": f"Hunt worker started for {seed} with limit {limit}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start worker: {str(e)}")

@router.get("/run/logs")
def get_hunt_logs(token: str = Depends(get_master_token)):
    logs_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'logs'))
    log_file_path = os.path.join(logs_dir, "hunt_worker.log")
    if not os.path.exists(log_file_path):
        return {"logs": ""}
    try:
        with open(log_file_path, "r") as f:
            content = f.read()
            return {"logs": content[-10000:]}
    except Exception:
        return {"logs": "Failed to read logs"}
