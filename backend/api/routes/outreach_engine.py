"""
outreach_engine.py
Routes for the AI-powered outreach brain, message queue, and generation.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone
from data import models, schemas, database
from api.dependencies import get_master_token
from providers.llm_provider import LLMProvider
from pydantic import BaseModel

router = APIRouter(prefix="/api/outreach", tags=["Outreach Engine"])

DELAY_MODES = {
    "safe":       (45, 180),
    "balanced":   (20, 90),
    "aggressive": (10, 45),
}

DEFAULT_SYSTEM_PROMPT = """You are an expert Telegram outreach specialist for a service that helps Telegram channel admins protect and grow their audience by creating backup channels.

Your job is to write a personalized first-contact DM to a channel admin.

Rules:
- Address them as "Boss" — NEVER use their channel name or admin username as a greeting
- Keep it SHORT (2-4 lines max, no walls of text)
- Casual tone, use 1-2 emojis naturally
- Open with a warm greeting + a question about their channel backup/security
- Subtly highlight the risk of losing their audience
- Do NOT mention any price, service name, or hard CTA in the first message
- End with a curiosity hook that makes them want to reply
- NEVER confuse the admin username with the channel name. The admin IS the person you're messaging. The channel is what they own."""

SALES_ADVICE = """
🟢 What's Working:
• Starting with a personal greeting and a question about their channel backup
• Showing genuine interest in the lead's content and audience
• Highlighting the risk of losing their main channel and offering a solution
• Using a casual, conversational tone with emojis

🔴 What's Killing Conversions:
• Being too pushy or aggressive with the sales pitch
• Not providing a clear explanation of the product or service
• Ignoring the lead's questions or concerns
• Quoting a high price without providing value or justification

🎯 Pain Point Analysis:
• Fear of losing their main channel and audience
• Difficulty in managing multiple channels and backups
• Concerns about scammers and fake accounts
• Need for a reliable and efficient backup system

📩 Top Opener Patterns:
• Starting with a personal greeting and a question about their channel backup
• Commenting on the lead's content and showing genuine interest
• Highlighting the risk of losing their main channel and offering a solution
"""

# ─── Brain ───────────────────────────────────────────────────────────────────

@router.get("/brain", response_model=schemas.OutreachBrainResponse)
def get_brain(db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    brain = db.query(models.OutreachBrain).first()
    if not brain:
        brain = models.OutreachBrain(system_prompt=DEFAULT_SYSTEM_PROMPT, advice_text=SALES_ADVICE, correction_log=[])
        db.add(brain)
        db.commit()
        db.refresh(brain)
    # Seed system_prompt if it's missing (existing row)
    if not brain.system_prompt:
        brain.system_prompt = DEFAULT_SYSTEM_PROMPT
        db.commit()
        db.refresh(brain)
    return brain

@router.put("/brain", response_model=schemas.OutreachBrainResponse)
def update_brain(req: schemas.OutreachBrainUpdate, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    brain = db.query(models.OutreachBrain).first()
    if not brain:
        brain = models.OutreachBrain(system_prompt=req.system_prompt or DEFAULT_SYSTEM_PROMPT, advice_text=req.advice_text, correction_log=[])
        db.add(brain)
    else:
        if req.system_prompt is not None:
            brain.system_prompt = req.system_prompt
        if req.advice_text is not None:
            brain.advice_text = req.advice_text
    db.commit()
    db.refresh(brain)
    return brain

@router.post("/brain/log-correction")
def log_correction(req: schemas.CorrectionLogEntry, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    brain = db.query(models.OutreachBrain).first()
    if not brain:
        brain = models.OutreachBrain(advice_text=SALES_ADVICE, correction_log=[])
        db.add(brain)
    log = brain.correction_log or []
    log.append({"original": req.original, "corrected": req.corrected, "reason": req.reason})
    brain.correction_log = log  # reassign to trigger SQLAlchemy change detection
    db.commit()
    return {"status": "logged", "total_corrections": len(log)}

# ─── AI Generation ───────────────────────────────────────────────────────────

def _build_prompt(brain: models.OutreachBrain, admin_username: str, channel_name: str, member_count) -> str:
    system_prompt = brain.system_prompt or DEFAULT_SYSTEM_PROMPT
    advice = brain.advice_text or SALES_ADVICE
    corrections_section = ""
    if brain.correction_log:
        corrections_section = "\n\nLEARNING FROM PAST CORRECTIONS (apply these lessons):\n"
        for c in brain.correction_log[-10:]:
            corrections_section += f"\n❌ Bad: {c['original']}\n✅ Better: {c['corrected']}\n"
            if c.get("reason"):
                corrections_section += f"   Why: {c['reason']}\n"

    member_text = f"{member_count:,}" if member_count else "unknown"

    return f"""{system_prompt}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROSPECT CONTEXT (use this EXACTLY, do not swap or hallucinate these details):
- Prospect Username (who you are DMing): @{admin_username}
- Channel They Own (their Telegram channel): {channel_name}
- Channel Size: {member_text} members
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STRATEGIC KNOWLEDGE BASE:
{advice}
{corrections_section}

Now write the DM. Return ONLY the message text. No quotes, no labels, no explanation."""

async def _generate_message(brain, admin_username: str, channel_name: str, member_count) -> str:
    prompt = _build_prompt(brain, admin_username, channel_name, member_count)
    messages = [{"role": "user", "content": prompt}]
    text, usage = await LLMProvider.generate_completion(messages=messages, temperature=0.75)
    return text

# ─── Queue ───────────────────────────────────────────────────────────────────

@router.get("/queue", response_model=List[schemas.OutreachQueueResponse])
def get_queue(status: str = "pending", db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    if "," in status:
        statuses = status.split(",")
        items = db.query(models.OutreachQueue).filter(models.OutreachQueue.status.in_(statuses)).order_by(models.OutreachQueue.created_at).all()
    else:
        items = db.query(models.OutreachQueue).filter(models.OutreachQueue.status == status).order_by(models.OutreachQueue.created_at).all()
    # Enrich with admin/channel info
    result = []
    for item in items:
        admin = db.query(models.AdminLead).filter(models.AdminLead.id == item.admin_lead_id).first()
        ch = db.query(models.ScrapedChannel).filter(models.ScrapedChannel.id == admin.channel_id).first() if admin and admin.channel_id else None
        result.append(schemas.OutreachQueueResponse(
            id=item.id,
            admin_lead_id=item.admin_lead_id,
            admin_username=admin.username if admin else None,
            channel_name=ch.title or ch.username if ch else None,
            generated_message=item.generated_message,
            edited_message=item.edited_message,
            was_edited=item.was_edited,
            status=item.status,
            created_at=item.created_at,
            approved_at=item.approved_at,
        ))
    return result

class QueueFillRequest(BaseModel):
    count: int = 10

@router.post("/queue/fill")
async def fill_queue(req: QueueFillRequest, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    """Generate AI openers for the next N fresh admins and add them to the queue."""
    n = req.count
    
    # Get admins already in queue to avoid duplicates
    queued_ids = [q.admin_lead_id for q in db.query(models.OutreachQueue).filter(
        models.OutreachQueue.status.in_(["pending", "approved"])
    ).all()]
    
    query = db.query(models.AdminLead).filter(models.AdminLead.status == "fresh")
    if queued_ids:
        query = query.filter(~models.AdminLead.id.in_(queued_ids))
    
    fresh_admins = query.order_by(models.AdminLead.created_at).limit(n).all()
    
    if not fresh_admins:
        return {"status": "no_fresh_admins", "generated": 0}
    
    brain = db.query(models.OutreachBrain).first()
    if not brain:
        brain = models.OutreachBrain(system_prompt=DEFAULT_SYSTEM_PROMPT, advice_text=SALES_ADVICE, correction_log=[])
        db.add(brain)
        db.commit()
        db.refresh(brain)
    if not brain.system_prompt:
        brain.system_prompt = DEFAULT_SYSTEM_PROMPT
        db.commit()
    
    generated = 0
    for admin in fresh_admins:
        try:
            ch = db.query(models.ScrapedChannel).filter(models.ScrapedChannel.id == admin.channel_id).first() if admin.channel_id else None
            channel_name = ch.title or ch.username or admin.username if ch else admin.username
            member_count = ch.members_count if ch else None
            
            message = await _generate_message(brain, admin.username, channel_name, member_count)
            
            queue_item = models.OutreachQueue(
                admin_lead_id=admin.id,
                generated_message=message.strip(),
                status="pending"
            )
            db.add(queue_item)
            generated += 1
            brain.generated_count = (brain.generated_count or 0) + 1
        except Exception as e:
            print(f"[Queue Fill] Error generating for {admin.username}: {e}")
    
    db.commit()
    return {"status": "ok", "generated": generated}

@router.put("/queue/{queue_id}", response_model=schemas.OutreachQueueResponse)
def update_queue_item(queue_id: int, req: schemas.OutreachQueueUpdate, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    item = db.query(models.OutreachQueue).filter(models.OutreachQueue.id == queue_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Queue item not found")
    
    if req.edited_message is not None:
        # Log the correction to the brain automatically
        brain = db.query(models.OutreachBrain).first()
        if brain and req.edited_message != item.generated_message:
            log = brain.correction_log or []
            log.append({"original": item.generated_message, "corrected": req.edited_message, "reason": None})
            brain.correction_log = log
        item.edited_message = req.edited_message
        item.was_edited = True
    
    if req.status is not None:
        item.status = req.status
        if req.status == "approved":
            item.approved_at = datetime.now(timezone.utc)
        elif req.status == "sent":
            admin = db.query(models.AdminLead).filter(models.AdminLead.id == item.admin_lead_id).first()
            if admin:
                lead = db.query(models.Lead).filter(models.Lead.username == admin.username).first()
                if not lead:
                    ch = db.query(models.ScrapedChannel).filter(models.ScrapedChannel.id == admin.channel_id).first() if admin.channel_id else None
                    lead = models.Lead(username=admin.username, status="Pitching", channel_username=ch.username if ch else None)
                    db.add(lead)
                    db.commit()
                    db.refresh(lead)
                else:
                    if lead.status == "Fresh":
                        lead.status = "Pitching"
                        db.commit()
                
                # Add interaction
                msg_content = item.edited_message or item.generated_message
                interaction = models.LeadInteraction(lead_id=lead.id, role="assistant", content=msg_content)
                db.add(interaction)
                db.commit()
    
    db.commit()
    db.refresh(item)
    
    admin = db.query(models.AdminLead).filter(models.AdminLead.id == item.admin_lead_id).first()
    ch = db.query(models.ScrapedChannel).filter(models.ScrapedChannel.id == admin.channel_id).first() if admin and admin.channel_id else None
    return schemas.OutreachQueueResponse(
        id=item.id, admin_lead_id=item.admin_lead_id,
        admin_username=admin.username if admin else None,
        channel_name=ch.title or ch.username if ch else None,
        generated_message=item.generated_message, edited_message=item.edited_message,
        was_edited=item.was_edited, status=item.status,
        created_at=item.created_at, approved_at=item.approved_at,
    )

@router.post("/queue/approve-all")
def approve_all(db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    now = datetime.now(timezone.utc)
    items = db.query(models.OutreachQueue).filter(models.OutreachQueue.status == "pending").all()
    for item in items:
        item.status = "approved"
        item.approved_at = now
    db.commit()
    return {"approved": len(items)}

@router.get("/queue/sent", response_model=List[schemas.OutreachQueueResponse])
def get_sent_history(db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    items = db.query(models.OutreachQueue).filter(models.OutreachQueue.status == "sent").order_by(models.OutreachQueue.approved_at.desc()).limit(50).all()
    result = []
    for item in items:
        admin = db.query(models.AdminLead).filter(models.AdminLead.id == item.admin_lead_id).first()
        ch = db.query(models.ScrapedChannel).filter(models.ScrapedChannel.id == admin.channel_id).first() if admin and admin.channel_id else None
        result.append(schemas.OutreachQueueResponse(
            id=item.id, admin_lead_id=item.admin_lead_id,
            admin_username=admin.username if admin else None,
            channel_name=ch.title or ch.username if ch else None,
            generated_message=item.generated_message, edited_message=item.edited_message,
            was_edited=item.was_edited, status=item.status,
            created_at=item.created_at, approved_at=item.approved_at,
        ))
    return result
