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
    print("[Outreach] Loop started")
    while OUTREACH_RUNNING:
        try:
            # 1. Fetch settings
            set_res = requests.get(f"{MAIN_BACKEND_URL}/api/hunts/settings", headers=HEADERS)
            settings = set_res.json() if set_res.ok else {}
            min_delay = settings.get("min_delay_minutes", 30)
            max_delay = settings.get("max_delay_minutes", 120)
            next_run_str = settings.get("next_outreach_run")
            
            # 2. Check if we need to sleep to resume a previous delay
            if next_run_str:
                next_run = datetime.fromisoformat(next_run_str.replace("Z", "+00:00"))
                now = datetime.now(timezone.utc)
                if next_run > now:
                    sleep_secs = (next_run - now).total_seconds()
                    print(f"[Outreach] Resuming sleep for {sleep_secs/60:.1f} minutes...")
                    await asyncio.sleep(sleep_secs)
            
            # 3. Fetch fresh admins
            adm_res = requests.get(f"{MAIN_BACKEND_URL}/api/hunts/admins?status=fresh", headers=HEADERS)
            admins = adm_res.json() if adm_res.ok else []
            if not admins:
                print("[Outreach] No fresh admins. Stopping.")
                OUTREACH_RUNNING = False
                requests.put(f"{MAIN_BACKEND_URL}/api/hunts/settings", json={"outreach_active": False}, headers=HEADERS)
                break
                
            admin = admins[0]
            username = admin["username"]
            admin_id = admin["id"]
            
            # 4. Fetch templates
            tpl_res = requests.get(f"{MAIN_BACKEND_URL}/api/hunts/templates", headers=HEADERS)
            templates = tpl_res.json() if tpl_res.ok else []
            if not templates:
                print("[Outreach] No templates found! Stopping.")
                OUTREACH_RUNNING = False
                requests.put(f"{MAIN_BACKEND_URL}/api/hunts/settings", json={"outreach_active": False}, headers=HEADERS)
                break
                
            tpl = random.choice(templates)
            message = tpl["content"].replace("{name}", username)
            
            # 5. Send message
            print(f"[Outreach] Sending to @{username}...")
            await client.send_message(username, message)
            
            # 6. Log it
            requests.post(f"{MAIN_BACKEND_URL}/api/hunts/outreach/log", json={
                "admin_lead_id": admin_id,
                "content": message,
                "message_variant": tpl["id"]
            }, headers=HEADERS)
            print(f"[Outreach] ✅ Sent.")
            
            # 7. Calculate next delay and save to DB
            delay_minutes = random.uniform(min_delay, max_delay)
            delay_seconds = int(delay_minutes * 60)
            next_run_time = datetime.now(timezone.utc).timestamp() + delay_seconds
            next_run_iso = datetime.fromtimestamp(next_run_time, tz=timezone.utc).isoformat()
            
            requests.put(f"{MAIN_BACKEND_URL}/api/hunts/settings", json={"next_outreach_run": next_run_iso}, headers=HEADERS)
            print(f"[Outreach] ⏳ Sleeping {delay_minutes:.1f} min...")
            
            await asyncio.sleep(delay_seconds)
            
        except asyncio.CancelledError:
            print("[Outreach] Loop cancelled.")
            break
        except Exception as e:
            print(f"[Outreach] Error in loop: {e}")
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

