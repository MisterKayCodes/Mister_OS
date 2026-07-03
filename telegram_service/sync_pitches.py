import asyncio
import os
import requests
from dotenv import load_dotenv
from telethon import TelegramClient
from telethon.tl.functions.messages import GetDialogFiltersRequest
from telethon.sessions import StringSession

# Load .env from the backend folder
env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))
load_dotenv(dotenv_path=env_path)

API_ID = os.getenv("API_ID")
API_HASH = os.getenv("API_HASH")
SESSION_STRING = os.getenv("SESSION_STRING", "")
SESSION_NAME = os.getenv("SESSION_NAME", "outreach_session")
MAIN_BACKEND_URL = os.getenv("MAIN_BACKEND_URL", "http://localhost:8011")
MASTER_TOKEN = "test-token" # Replace with actual master token from Mister OS

session_storage = StringSession(SESSION_STRING) if SESSION_STRING else SESSION_NAME
client = TelegramClient(session_storage, API_ID, API_HASH)

async def main():
    await client.start()
    print("Fetching Telegram Folders...")
    
    # Get all dialog filters (Folders)
    filters = await client(GetDialogFiltersRequest())
    
    pitches_filter = None
    for f in filters:
        if hasattr(f, 'title') and f.title == "Pitches":
            pitches_filter = f
            break
            
    if not pitches_filter:
        print("Could not find a folder named 'Pitches'.")
        return

    print("Found 'Pitches' folder. Extracting chats...")
    
    # Note: Extracting chats exactly from a filter requires iterating through dialogs
    # and checking if they match the filter conditions. 
    # For simplicity, if we assume pinned peers or include_peers are the main ones:
    peers = pitches_filter.include_peers
    
    for peer in peers:
        try:
            entity = await client.get_entity(peer)
            username = entity.username or entity.title or str(entity.id)
            print(f"Scraping chat: {username}")
            
            messages = await client.get_messages(entity, limit=50) # Get last 50 messages
            messages.reverse()
            
            chat_log = ""
            for msg in messages:
                sender = "Me" if msg.out else "Lead"
                text = msg.text or "[Attachment]"
                chat_log += f"{sender}: {text}\n"
            
            # Send to Mister OS for AI Analysis & Vector DB Storage
            print(f"Sending {username} chat to Mister OS for analysis...")
            prompt = f"Analyze this past sales pitch. Did it close? What was the objection? How did the seller handle it? Summarize the lesson learned.\n\n{chat_log}"
            
            # 1. Ask AI to analyze it (using main backend)
            ai_res = requests.post(
                f"{MAIN_BACKEND_URL}/api/ai/omni-chat", 
                json={"message": prompt},
                headers={"X-Master-Token": MASTER_TOKEN}
            )
            analysis = ai_res.json().get("reply", "No analysis")
            
            # 2. Save to Notes (which Auto-Indexes into Vector DB)
            note_content = f"Training Pitch: {username}\n\n{analysis}\n\nRAW CHAT:\n{chat_log}"
            requests.post(
                f"{MAIN_BACKEND_URL}/api/notes/",
                json={"title": f"Pitch Review: {username}", "content": note_content},
                headers={"X-Master-Token": MASTER_TOKEN}
            )
            print(f"✅ Saved training data for {username}")
            
        except Exception as e:
            print(f"Skipping a peer due to error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
