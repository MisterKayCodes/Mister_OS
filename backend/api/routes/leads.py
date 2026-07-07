from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from data import models, schemas, database
from api.dependencies import get_master_token
from services.sales_service import SalesService
import httpx
import os
from datetime import datetime, timezone, timedelta

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
async def approve_draft(interaction_id: int, req: dict = None, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    from fastapi import Body
    interaction = db.query(models.LeadInteraction).filter(models.LeadInteraction.id == interaction_id).first()
    if not interaction or not interaction.is_draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    
    lead = db.query(models.Lead).filter(models.Lead.id == interaction.lead_id).first()
    
    # Check if user edited the message — if so, log the correction to the OutreachBrain
    final_content = interaction.content
    if req and req.get("edited_content") and req["edited_content"] != interaction.content:
        final_content = req["edited_content"]
        brain = db.query(models.OutreachBrain).first()
        if brain:
            log = brain.correction_log or []
            log.append({
                "original": interaction.content,
                "corrected": final_content,
                "reason": req.get("reason", "User correction on follow-up")
            })
            brain.correction_log = log
        interaction.content = final_content
    
    # Mark as no longer a draft
    interaction.is_draft = False
    db.commit()
    db.refresh(interaction)
    
    # Dispatch to Telegram Microservice
    telegram_svc_url = os.getenv("TELEGRAM_SVC_URL", "http://127.0.0.1:8012")
    if lead:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                await client.post(f"{telegram_svc_url}/send", json={
                    "username": lead.username,
                    "content": final_content,
                    "is_handoff_alert": False
                })
        except Exception as e:
            print(f"[Approve Draft] Telegram dispatch failed for @{lead.username}: {e}")
    
    return {"status": "approved_and_sent", "interaction": interaction}

@router.post("/generate-followups")
async def generate_followups(
    db: Session = Depends(database.get_db),
    token: str = Depends(get_master_token)
):
    """
    Scans all 'Follow-up' leads idle for 3+ days and generates
    a contextual AI follow-up draft for each one.
    """
    from providers.llm_provider import LLMProvider
    
    cutoff = datetime.now(timezone.utc) - timedelta(days=3)
    
    # Auto-transition stale 'Pitching' leads to 'Follow-up' before scanning
    stale_pitching = db.query(models.Lead).filter(models.Lead.status == "Pitching").all()
    for p_lead in stale_pitching:
        last_msg = db.query(models.LeadInteraction).filter(models.LeadInteraction.lead_id == p_lead.id).order_by(models.LeadInteraction.timestamp.desc()).first()
        if last_msg and last_msg.timestamp.replace(tzinfo=timezone.utc) < cutoff:
            p_lead.status = "Follow-up"
    db.commit()

    followup_leads = db.query(models.Lead).filter(models.Lead.status == "Follow-up").all()
    
    generated = 0
    skipped = 0
    
    for lead in followup_leads:
        # Check there's no pending draft already
        existing_draft = db.query(models.LeadInteraction).filter(
            models.LeadInteraction.lead_id == lead.id,
            models.LeadInteraction.is_draft == True
        ).first()
        if existing_draft:
            skipped += 1
            continue
        
        # Get the last message timestamp
        last_msg = db.query(models.LeadInteraction).filter(
            models.LeadInteraction.lead_id == lead.id
        ).order_by(models.LeadInteraction.timestamp.desc()).first()
        
        if last_msg and last_msg.timestamp.replace(tzinfo=timezone.utc) > cutoff:
            skipped += 1
            continue  # Too recent, skip
        
        # Build full chat history for context
        history = db.query(models.LeadInteraction).filter(
            models.LeadInteraction.lead_id == lead.id
        ).order_by(models.LeadInteraction.timestamp.asc()).all()
        
        if not history:
            skipped += 1
            continue
        
        chat_text = "\n".join([f"{msg.role.upper()}: {msg.content}" for msg in history[-20:]])
        
        # Fetch brain for context
        brain = db.query(models.OutreachBrain).first()
        advice = brain.advice_text if brain else ""
        corrections = ""
        if brain and brain.correction_log:
            corrections = "\nLEARNING FROM PAST CORRECTIONS:\n"
            for c in brain.correction_log[-5:]:
                corrections += f"❌ Bad: {c['original'][:80]}...\n✅ Better: {c['corrected'][:80]}...\n"
        
        prompt = f"""You are Mister, an expert Telegram closer following up with a prospect.

Here is the full chat history with @{lead.username}:
{chat_text}

SALES INTELLIGENCE:
{advice}
{corrections}

This prospect has gone quiet. Your job is to write a SHORT, punchy, natural follow-up message.
Rules:
- Reference something specific from the previous conversation to show you remember them.
- Be warm, not desperate. Curiosity works better than pressure.
- 2-3 lines MAX. No walls of text.
- No generic "just checking in" messages. Be specific and personal.
- Do NOT use their username as a greeting. Start naturally.
Return ONLY the message text. No quotes, no labels."""
        
        try:
            messages = [{"role": "user", "content": prompt}]
            reply, _ = await LLMProvider.generate_completion(messages=messages, temperature=0.75)
            
            draft = models.LeadInteraction(
                lead_id=lead.id,
                role="assistant",
                content=reply.strip(),
                is_draft=True
            )
            db.add(draft)
            generated += 1
        except Exception as e:
            print(f"[Follow-up Gen] Failed for @{lead.username}: {e}")
            skipped += 1
    
    db.commit()
    return {"status": "ok", "generated": generated, "skipped": skipped}


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

@router.post("/scrape-pitching", response_model=schemas.ChatTranscriptResponse)
def save_scraped_pitching_chat(req: schemas.ScrapePitchingPayload, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    # Find or create lead
    lead = db.query(models.Lead).filter(models.Lead.username == req.username).first()
    if not lead:
        lead = models.Lead(username=req.username, channel_username=req.profile_name, status=req.status)
        db.add(lead)
    else:
        lead.status = req.status
        lead.channel_username = req.profile_name

    # Update timestamps and state
    lead.first_contact_at = req.first_contact_at
    lead.last_our_message_at = req.last_our_message_at
    lead.last_their_message_at = req.last_their_message_at
    lead.read_receipt_seen = req.read_receipt_seen
    lead.follow_up_sent = req.follow_up_sent
    db.commit()
    db.refresh(lead)

    # Save transcript
    transcript = db.query(models.ChatTranscript).filter(models.ChatTranscript.lead_id == lead.id).first()
    if transcript:
        transcript.transcript = req.transcript
    else:
        transcript = models.ChatTranscript(lead_id=lead.id, transcript=req.transcript)
        db.add(transcript)
    
    db.commit()
    db.refresh(transcript)
    return transcript

@router.get("/transcripts", response_model=List[dict])
def get_chat_transcripts(db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    # Join ChatTranscript with Lead to get username and channel_username
    results = db.query(models.ChatTranscript, models.Lead).join(models.Lead).order_by(models.ChatTranscript.scraped_at.desc()).all()
    
    transcripts = []
    for t, l in results:
        transcripts.append({
            "id": t.id,
            "lead_id": l.id,
            "username": l.username,
            "profile_name": l.channel_username or l.username,
            "status": l.status,
            "transcript": t.transcript,
            "scraped_at": t.scraped_at
        })
    return transcripts

import httpx
import os
import json

@router.post("/analyse", response_model=schemas.AnalysisReportResponse)
async def generate_analysis_report(db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    # 1. Fetch all transcripts and lead statuses
    results = db.query(models.ChatTranscript, models.Lead).join(models.Lead).all()
    
    if not results:
        raise HTTPException(status_code=400, detail="No chat transcripts found to analyse.")
    
    # 2. Build the prompt payload
    chat_data = []
    for t, l in results:
        chat_data.append(f"--- LEAD: @{l.username} | STATUS: {l.status} ---\n{t.transcript}")
    
    all_chats_text = "\n\n".join(chat_data)
    
    prompt = f"""You are a master Sales Coach and Pattern Detector.
I am providing you with {len(results)} chat transcripts between me (YOU) and various leads. Each lead has an ultimate outcome STATUS (Hot, Dead, Follow-up, Pitching).
Your job is to read these conversations and identify exact patterns that lead to success (Hot) or failure (Dead).

Return your analysis strictly as a JSON object with EXACTLY these four keys:
- "working_patterns": A concise, punchy bullet-point list of what specific angles or phrases are getting replies.
- "killing_patterns": A concise, punchy bullet-point list of where leads are dropping off or going Dead.
- "pain_points": A brief analysis of any recurring pain points or channel-specific behaviors you noticed.
- "top_openers": A brief ranking or observation of which initial contact messages worked best.

Ensure the output is 100% pure JSON without any markdown formatting blocks like ```json.
Here are the transcripts:

{all_chats_text}"""

    # 3. Call Groq
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")
        
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            res = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}"},
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.3,
                    "response_format": {"type": "json_object"}
                }
            )
            res.raise_for_status()
            data = res.json()
            content = data["choices"][0]["message"]["content"]
            parsed = json.loads(content)
            
            # Extract usage
            usage = data.get("usage", {})
            try:
                db.add(models.TokenUsageLog(
                    task_name="analyse_all",
                    prompt_tokens=usage.get("prompt_tokens", 0),
                    completion_tokens=usage.get("completion_tokens", 0),
                    total_tokens=usage.get("total_tokens", 0),
                    model="llama-3.3-70b-versatile"
                ))
            except Exception:
                pass
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=500, detail=f"Groq API Error: {e.response.text}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"LLM Processing Error: {str(e)}")

    # Helper to ensure we always save a string (Groq sometimes returns a list of bullet points)
    def to_str(val):
        if isinstance(val, list):
            return "\n".join(f"• {str(item)}" for item in val)
        return str(val) if val else ""

    # 4. Save to Database
    report = models.AnalysisReport(
        working_patterns=to_str(parsed.get("working_patterns")),
        killing_patterns=to_str(parsed.get("killing_patterns")),
        pain_points=to_str(parsed.get("pain_points")),
        top_openers=to_str(parsed.get("top_openers"))
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    
    return report

@router.get("/analysis", response_model=schemas.AnalysisReportResponse)
def get_latest_analysis(db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    report = db.query(models.AnalysisReport).order_by(models.AnalysisReport.created_at.desc()).first()
    if not report:
        raise HTTPException(status_code=404, detail="No analysis found")
    return report
