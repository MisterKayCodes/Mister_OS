import asyncio
import os
import requests
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from telethon import TelegramClient, events
from telethon.tl.types import PeerUser
from telethon.sessions import StringSession

# Load .env from the backend folder
env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))
load_dotenv(dotenv_path=env_path)

API_ID = os.getenv("API_ID")
API_HASH = os.getenv("API_HASH")
SESSION_STRING = os.getenv("SESSION_STRING", "")
SESSION_NAME = os.getenv("SESSION_NAME", "outreach_session")
MAIN_BACKEND_URL = os.getenv("MAIN_BACKEND_URL", "http://localhost:8011")
MAIN_ACCOUNT_USERNAME = os.getenv("MAIN_ACCOUNT_USERNAME")

# If SESSION_STRING is provided, it uses that. Otherwise, falls back to an SQLite file named SESSION_NAME.
session_storage = StringSession(SESSION_STRING) if SESSION_STRING else SESSION_NAME
client = TelegramClient(session_storage, API_ID, API_HASH)
app = FastAPI(title="Mister OS - Telegram Microservice")

@app.on_event("startup")
async def startup_event():
    await client.start()
    print("Telethon client started!")
    
    # Passive Event Listener for Incoming Messages
    @client.on(events.NewMessage(incoming=True))
    async def handler(event):
        if event.is_private:
            sender = await event.get_sender()
            if not sender.bot:
                username = sender.username or str(sender.id)
                message = event.text
                
                print(f"Received message from @{username}: {message}")
                
                # Forward to main backend webhook
                payload = {
                    "username": username,
                    "message": message,
                    "role": "user"
                }
                try:
                    requests.post(f"{MAIN_BACKEND_URL}/api/leads/webhook", json=payload)
                except Exception as e:
                    print(f"Failed to hit webhook: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    await client.disconnect()

class SendMessageReq(BaseModel):
    username: str
    content: str
    is_handoff_alert: bool = False

@app.post("/send")
async def send_message(req: SendMessageReq):
    try:
        if req.is_handoff_alert:
            # Send alert to the Boss
            if MAIN_ACCOUNT_USERNAME:
                alert_msg = f"🚨 BOSS ALERT 🚨\n\nHandoff triggered for lead: @{req.username}\nReason: {req.content}\n\nTake over the chat immediately!"
                await client.send_message(MAIN_ACCOUNT_USERNAME, alert_msg)
            return {"status": "alert sent"}
        else:
            # Send standard auto-reply to the prospect
            await client.send_message(req.username, req.content)
            
            # Log it back to the backend
            payload = {
                "username": req.username,
                "message": req.content,
                "role": "assistant"
            }
            requests.post(f"{MAIN_BACKEND_URL}/api/leads/webhook", json=payload)
            
            return {"status": "sent"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from datetime import datetime, timezone
import random

OUTREACH_RUNNING = False
outreach_task = None
MASTER_TOKEN = os.getenv("MASTER_TOKEN", "")
HEADERS = {"X-Master-Token": MASTER_TOKEN, "Content-Type": "application/json"}

async def outreach_loop():
    global OUTREACH_RUNNING
    import random
    print("[Outreach] Queue-based loop started")
    
    DELAY_MODES = {
        "safe":       (45, 180),
        "balanced":   (20, 90),
        "aggressive": (10, 45),
    }
    
    while OUTREACH_RUNNING:
        try:
            # 1. Fetch settings for delay mode
            set_res = requests.get(f"{MAIN_BACKEND_URL}/api/hunts/settings", headers=HEADERS)
            settings = set_res.json() if set_res.ok else {}
            delay_mode = settings.get("delay_mode", "balanced")
            min_delay, max_delay = DELAY_MODES.get(delay_mode, (20, 90))
            next_run_str = settings.get("next_outreach_run")
            
            # 2. Respect scheduled next_run time
            if next_run_str:
                next_run = datetime.fromisoformat(next_run_str.replace("Z", "+00:00"))
                now = datetime.now(timezone.utc)
                if next_run > now:
                    sleep_secs = (next_run - now).total_seconds()
                    print(f"[Outreach] Sleeping {sleep_secs/60:.1f} min until next scheduled send...")
                    await asyncio.sleep(sleep_secs)
            
            # 3. Fetch next approved queue item
            q_res = requests.get(f"{MAIN_BACKEND_URL}/api/outreach/queue?status=approved", headers=HEADERS)
            queue_items = q_res.json() if q_res.ok else []
            
            if not queue_items:
                print("[Outreach] No approved items in queue. Waiting 60s...")
                await asyncio.sleep(60)
                continue
            
            item = queue_items[0]
            queue_id = item["id"]
            username = item["admin_username"]
            # Use edited message if user tweaked it, otherwise use generated
            message = item.get("edited_message") or item["generated_message"]
            admin_id = item["admin_lead_id"]
            
            if not username:
                print(f"[Outreach] Queue item {queue_id} has no username, skipping.")
                requests.put(f"{MAIN_BACKEND_URL}/api/outreach/queue/{queue_id}", json={"status": "skipped"}, headers=HEADERS)
                continue
            
            # 4. Send via Telegram
            print(f"[Outreach] Sending to @{username}...")
            try:
                await client.send_message(username, message)
            except Exception as send_err:
                print(f"[Outreach] ❌ Failed to send to @{username}: {send_err}")
                requests.put(f"{MAIN_BACKEND_URL}/api/outreach/queue/{queue_id}", json={"status": "failed"}, headers=HEADERS)
                # Log the failure as an interaction so they see it in the CRM
                requests.post(f"{MAIN_BACKEND_URL}/api/hunts/outreach/log", json={
                    "admin_lead_id": admin_id,
                    "content": f"[SYSTEM: Failed to send via Telegram. Error: {str(send_err)}]",
                    "message_variant": None
                }, headers=HEADERS)
                continue  # Skip to the next one instantly without sleeping

            # 5. Mark queue item as sent
            requests.put(f"{MAIN_BACKEND_URL}/api/outreach/queue/{queue_id}", json={"status": "sent"}, headers=HEADERS)
            
            # 6. Log to outreach log
            requests.post(f"{MAIN_BACKEND_URL}/api/hunts/outreach/log", json={
                "admin_lead_id": admin_id,
                "content": message,
                "message_variant": None
            }, headers=HEADERS)
            print(f"[Outreach] ✅ Sent to @{username}")
            
            # 7. Schedule next send
            delay_minutes = random.uniform(min_delay, max_delay)
            delay_seconds = int(delay_minutes * 60)
            next_run_time = datetime.now(timezone.utc).timestamp() + delay_seconds
            next_run_iso = datetime.fromtimestamp(next_run_time, tz=timezone.utc).isoformat()
            requests.put(f"{MAIN_BACKEND_URL}/api/hunts/settings", json={"next_outreach_run": next_run_iso}, headers=HEADERS)
            print(f"[Outreach] ⏳ Next send in {delay_minutes:.1f} min ({delay_mode} mode)")
            
            await asyncio.sleep(delay_seconds)
            
        except asyncio.CancelledError:
            print("[Outreach] Loop cancelled.")
            break
        except Exception as e:
            print(f"[Outreach] Error: {e}")
            await asyncio.sleep(60)

@app.post("/api/outreach/start")
async def start_outreach():
    global OUTREACH_RUNNING, outreach_task
    if OUTREACH_RUNNING:
        return {"status": "already_running"}
    
    # Update DB
    requests.put(f"{MAIN_BACKEND_URL}/api/hunts/settings", json={"outreach_active": True}, headers=HEADERS)
    
    OUTREACH_RUNNING = True
    outreach_task = asyncio.create_task(outreach_loop())
    return {"status": "started"}

@app.post("/api/outreach/stop")
async def stop_outreach():
    global OUTREACH_RUNNING, outreach_task
    if not OUTREACH_RUNNING:
        return {"status": "not_running"}
        
    OUTREACH_RUNNING = False
    if outreach_task:
        outreach_task.cancel()
        
    # Update DB and clear next_run so it doesn't resume a stale timer later
    requests.put(f"{MAIN_BACKEND_URL}/api/hunts/settings", json={"outreach_active": False, "next_outreach_run": None}, headers=HEADERS)
    return {"status": "stopped"}

@app.get("/api/outreach/status")
async def outreach_status():
    return {"running": OUTREACH_RUNNING}

@app.post("/api/outreach/force")
async def force_send():
    """Directly fetches and sends the next approved queue item right now, bypassing the sleep timer."""
    # Fetch next approved item
    q_res = requests.get(f"{MAIN_BACKEND_URL}/api/outreach/queue?status=approved", headers=HEADERS)
    if not q_res.ok:
        raise HTTPException(status_code=500, detail="Could not fetch queue from backend")
    
    queue_items = q_res.json()
    if not queue_items:
        raise HTTPException(status_code=404, detail="No approved items in queue to send")
    
    item = queue_items[0]
    queue_id = item["id"]
    username = item.get("admin_username")
    message = item.get("edited_message") or item["generated_message"]
    admin_id = item["admin_lead_id"]
    
    if not username:
        raise HTTPException(status_code=400, detail="Queue item has no username")
    
    # Send directly via Telegram
    try:
        await client.send_message(username, message)
    except Exception as e:
        requests.put(f"{MAIN_BACKEND_URL}/api/outreach/queue/{queue_id}", json={"status": "failed"}, headers=HEADERS)
        raise HTTPException(status_code=500, detail=f"Telegram send failed: {str(e)}")
    
    # Mark as sent
    requests.put(f"{MAIN_BACKEND_URL}/api/outreach/queue/{queue_id}", json={"status": "sent"}, headers=HEADERS)
    
    # Log it
    requests.post(f"{MAIN_BACKEND_URL}/api/hunts/outreach/log", json={
        "admin_lead_id": admin_id,
        "content": message,
        "message_variant": None
    }, headers=HEADERS)
    
    # Also reset the next_outreach_run so the loop continues normally from now
    now_iso = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    requests.put(f"{MAIN_BACKEND_URL}/api/hunts/settings", json={"next_outreach_run": now_iso}, headers=HEADERS)
    
    print(f"[Outreach] ⚡ Force sent to @{username}")
    return {"status": "sent", "username": username}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8012)

