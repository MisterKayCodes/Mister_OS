import os
import asyncio
from datetime import datetime, timezone
import httpx
from dotenv import load_dotenv
from telethon import TelegramClient
from telethon.sessions import StringSession
from telethon.tl.functions.messages import GetDialogFiltersRequest

# Load config
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "backend", ".env"))

API_ID = os.getenv("API_ID")
API_HASH = os.getenv("API_HASH")
SESSION_STRING = os.getenv("SESSION_STRING", "")
SESSION_NAME = os.getenv("SESSION_NAME", "outreach_session")
BACKEND = os.getenv("MAIN_BACKEND_URL", "http://localhost:8011")
MASTER_TOKEN = os.getenv("MASTER_TOKEN", "")

session_storage = StringSession(SESSION_STRING) if SESSION_STRING else SESSION_NAME
client = TelegramClient(session_storage, API_ID, API_HASH)

HEADERS = {"X-Master-Token": MASTER_TOKEN, "Content-Type": "application/json"}

class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

async def scan_folders():
    print(f"\n{Colors.CYAN}Fetching your Telegram Folders...{Colors.ENDC}")
    try:
        filters_response = await client(GetDialogFiltersRequest())
        folders = [f.title for f in filters_response if hasattr(f, 'title')]
        if folders:
            print(f"{Colors.GREEN}Found Folders:{Colors.ENDC} {', '.join(folders)}")
        else:
            print(f"{Colors.WARNING}No custom folders found on your account.{Colors.ENDC}")
        return filters_response
    except Exception as e:
        print(f"{Colors.FAIL}Error fetching folders: {e}{Colors.ENDC}")
        return []

async def main():
    await client.start()
    
    filters = await scan_folders()
    
    target_folder_name = "pitching"
    target_folder = next((f for f in filters if hasattr(f, 'title') and f.title.lower() == target_folder_name), None)
    
    if not target_folder or not hasattr(target_folder, 'include_peers') or not target_folder.include_peers:
        print(f"\n{Colors.FAIL}Could not find a folder named '{target_folder_name}' or it is empty.{Colors.ENDC}")
        await client.disconnect()
        return

    print(f"\n{Colors.HEADER}Scanning folder '{target_folder.title}' and fetching transcripts...{Colors.ENDC}")
    
    async with httpx.AsyncClient(timeout=30.0) as http:
        for peer in target_folder.include_peers:
            try:
                entity = await client.get_entity(peer)
                # Skip bots and deleted accounts
                if getattr(entity, 'bot', False) or getattr(entity, 'deleted', False):
                    continue
                    
                username = getattr(entity, 'username', None)
                if not username:
                    username = str(entity.id)
                
                profile_name = getattr(entity, 'first_name', '') or ''
                if getattr(entity, 'last_name', None):
                    profile_name += f" {entity.last_name}"
                profile_name = profile_name.strip() or username

                messages = await client.get_messages(entity, limit=100)
                if not messages:
                    continue
                
                # Determine status
                last_msg = messages[0]
                status = "Pitching"
                if not last_msg.out:
                    status = "Hot"
                else:
                    time_diff = datetime.now(timezone.utc) - last_msg.date
                    if time_diff.total_seconds() > (48 * 3600):
                        status = "Cold"
                
                # Build transcript string
                transcript_lines = []
                for msg in reversed(messages):
                    sender = "YOU" if getattr(msg, 'out', False) else f"@{username}"
                    text = getattr(msg, 'text', '') or "[Media/Sticker]"
                    if text:
                        transcript_lines.append(f"{sender}: {text}")
                
                transcript_str = "\n\n".join(transcript_lines)
                
                # Send to backend
                payload = {
                    "username": username,
                    "profile_name": profile_name,
                    "status": status,
                    "transcript": transcript_str
                }
                
                res = await http.post(f"{BACKEND}/api/leads/scrape-pitching", json=payload, headers=HEADERS)
                if res.status_code == 200:
                    print(f"{Colors.GREEN}[+] Scraped @{username} -> {status}{Colors.ENDC}")
                else:
                    print(f"{Colors.FAIL}[-] Failed to save @{username}: {res.text}{Colors.ENDC}")
                    
                await asyncio.sleep(1) # Rate limit safety
                
            except Exception as e:
                print(f"{Colors.WARNING}[!] Error processing a peer: {e}{Colors.ENDC}")
                continue

    print(f"\n{Colors.GREEN}Finished scraping '{target_folder.title}'!{Colors.ENDC}")
    await client.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
