"""
import_existing_chats.py
Imports your existing private Telegram chats into the Mister OS backend.
Detects if a message was opened/read by the recipient but not replied to.

Usage: python import_existing_chats.py
"""
import asyncio
import os
import requests
from datetime import datetime
from dotenv import load_dotenv
from telethon import TelegramClient
from telethon.sessions import StringSession
from telethon.tl.types import User

env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))
load_dotenv(dotenv_path=env_path)

API_ID = os.getenv("API_ID")
API_HASH = os.getenv("API_HASH")
STRING_SESSION = os.getenv("STRING_SESSION", "")
SESSION_NAME = os.getenv("SESSION_NAME", "outreach_session")
BACKEND = os.getenv("MAIN_BACKEND_URL", "http://localhost:8011")
MASTER_TOKEN = os.getenv("MASTER_TOKEN", "")

session_storage = StringSession(STRING_SESSION) if STRING_SESSION else SESSION_NAME
client = TelegramClient(session_storage, API_ID, API_HASH)

HEADERS = {"X-Master-Token": MASTER_TOKEN, "Content-Type": "application/json"}

def create_lead(username: str, status: str = "Cold"):
    try:
        r = requests.post(f"{BACKEND}/api/leads/", json={"username": username, "status": status}, headers=HEADERS, timeout=10)
        return r.json()
    except Exception as e:
        print(f"  [!] Failed to create lead for @{username}: {e}")
        return {}

def add_interaction(lead_id: int, role: str, content: str):
    try:
        requests.post(f"{BACKEND}/api/leads/webhook", json={
            "username": "__internal__",  # bypass normal flow
            "lead_id": lead_id,
            "role": role,
            "message": content
        }, timeout=10)
    except Exception:
        pass

async def main():
    await client.start()
    print("Importing existing chats...\n")

    imported = 0
    async for dialog in client.iter_dialogs(limit=50):
        if not dialog.is_user:
            continue  # Only process private chats
        entity = dialog.entity
        if not isinstance(entity, User) or entity.bot:
            continue

        username = entity.username or str(entity.id)
        last_msg = dialog.message

        # ── Read status detection ──
        # read_outbox_max_id = the ID of the last message THEY read from us
        # If our last sent message ID <= read_outbox_max_id, they read it.
        if last_msg and last_msg.out:
            they_read = last_msg.id <= (dialog.dialog.read_outbox_max_id or 0)
            they_replied = not last_msg.out  # last message is from them
        else:
            they_read = False
            they_replied = last_msg and not last_msg.out if last_msg else False

        # Determine status
        if they_replied:
            read_status = "Replied ✅"
            lead_status = "Warm"
        elif they_read:
            read_status = "Opened but NO reply 👁️"
            lead_status = "Cold"
        else:
            read_status = "Not opened ❌"
            lead_status = "Cold"

        print(f"@{username} — {read_status}")

        # Create the lead in backend
        lead_data = create_lead(username, lead_status)
        lead_id = lead_data.get("id")
        print(f"  Created lead ID: {lead_id}")

        imported += 1

        if imported >= 50:
            break

    print(f"\nDone. Imported {imported} existing chats.")
    print("\nNext step: Go to the War Room in the UI and manually classify leads")
    print("into the correct folders (Dead, Warm, etc.).")

if __name__ == "__main__":
    asyncio.run(main())
