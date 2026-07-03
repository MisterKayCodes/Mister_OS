"""
auto_sort.py
Scans all existing leads in the Pitching Telegram folder,
extracts exact timestamps, and auto-sorts them into the correct
5-stage pipeline: Fresh | Pitching | Follow-up | Hot | Dead
"""
import os
import asyncio
from datetime import datetime, timezone, timedelta
import httpx
from dotenv import load_dotenv
from telethon import TelegramClient
from telethon.sessions import StringSession
from telethon.tl.functions.messages import GetDialogFiltersRequest

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

NOW = datetime.now(timezone.utc)

class Colors:
    GREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    CYAN = '\033[96m'
    BOLD = '\033[1m'
    ENDC = '\033[0m'

def classify_lead(last_msg_is_ours, last_our_ts, last_their_ts, follow_up_sent, read_receipt):
    """
    Returns the correct pipeline status based on the time math.
    """
    # They replied — always Hot
    if last_their_ts and (not last_our_ts or last_their_ts > last_our_ts):
        return "Hot"

    # We sent last — check timing
    if last_our_ts:
        hours_since_our_msg = (NOW - last_our_ts).total_seconds() / 3600

        # Ignored follow-up for 5+ days → Dead
        if follow_up_sent and hours_since_our_msg >= (5 * 24):
            return "Dead"

        # Read but ignored 24-72 hrs, or unread 3+ days → Follow-up
        if not follow_up_sent:
            if read_receipt and hours_since_our_msg >= 24:
                return "Follow-up"
            if not read_receipt and hours_since_our_msg >= (3 * 24):
                return "Follow-up"

        # Recently sent, waiting
        return "Pitching"

    return "Fresh"

async def main():
    await client.start()

    print(f"\n{Colors.CYAN}Fetching Telegram folders...{Colors.ENDC}")
    filters = await client(GetDialogFiltersRequest())

    target_folder = next((f for f in filters if hasattr(f, 'title') and f.title.lower() == "pitching"), None)

    if not target_folder or not hasattr(target_folder, 'include_peers') or not target_folder.include_peers:
        print(f"{Colors.FAIL}Could not find 'Pitching' folder.{Colors.ENDC}")
        await client.disconnect()
        return

    print(f"{Colors.CYAN}Auto-sorting leads in '{target_folder.title}'...{Colors.ENDC}\n")

    async with httpx.AsyncClient(timeout=30.0) as http:
        for peer in target_folder.include_peers:
            try:
                entity = await client.get_entity(peer)
                if getattr(entity, 'bot', False) or getattr(entity, 'deleted', False):
                    continue

                username = getattr(entity, 'username', None) or str(entity.id)
                profile_name = (getattr(entity, 'first_name', '') or '').strip()
                if getattr(entity, 'last_name', None):
                    profile_name += f" {entity.last_name}"
                profile_name = profile_name.strip() or username

                messages = await client.get_messages(entity, limit=100)
                if not messages:
                    continue

                # Extract timestamps
                last_our_msg = next((m for m in messages if m.out), None)
                last_their_msg = next((m for m in messages if not m.out), None)
                first_our_msg = next((m for m in reversed(messages) if m.out), None)

                last_our_ts = last_our_msg.date if last_our_msg else None
                last_their_ts = last_their_msg.date if last_their_msg else None
                first_contact_ts = first_our_msg.date if first_our_msg else None

                # Read receipt: check if Telegram marked the last outgoing message as read
                read_receipt = False
                if last_our_msg and hasattr(last_our_msg, 'out') and last_our_msg.out:
                    # Check via get_messages with a fresh single fetch
                    single = await client.get_messages(entity, limit=1)
                    if single and single[0].id == last_our_msg.id:
                        # If they are further along in the conversation, they've seen it
                        read_receipt = bool(last_their_ts)

                status = classify_lead(
                    last_msg_is_ours=bool(last_our_msg),
                    last_our_ts=last_our_ts,
                    last_their_ts=last_their_ts,
                    follow_up_sent=False,  # We never auto-assume follow-up was sent
                    read_receipt=read_receipt
                )

                # Build transcript
                transcript_lines = []
                for msg in reversed(messages):
                    sender = "YOU" if getattr(msg, 'out', False) else f"@{username}"
                    text = getattr(msg, 'text', '') or "[Media/Sticker]"
                    if text:
                        date_str = msg.date.strftime('%Y-%m-%d %H:%M')
                        transcript_lines.append(f"[{date_str}] {sender}: {text}")
                transcript_str = "\n".join(transcript_lines)

                payload = {
                    "username": username,
                    "profile_name": profile_name,
                    "status": status,
                    "transcript": transcript_str,
                    "first_contact_at": first_contact_ts.isoformat() if first_contact_ts else None,
                    "last_our_message_at": last_our_ts.isoformat() if last_our_ts else None,
                    "last_their_message_at": last_their_ts.isoformat() if last_their_ts else None,
                    "read_receipt_seen": read_receipt,
                    "follow_up_sent": False,
                }

                res = await http.post(f"{BACKEND}/api/leads/scrape-pitching", json=payload, headers=HEADERS)
                if res.status_code == 200:
                    print(f"{Colors.GREEN}[✓] @{username} → {status}{Colors.ENDC}")
                else:
                    print(f"{Colors.FAIL}[✗] @{username}: {res.text}{Colors.ENDC}")

                await asyncio.sleep(1.5)

            except Exception as e:
                print(f"{Colors.WARNING}[!] Error processing a peer: {e}{Colors.ENDC}")
                continue

    print(f"\n{Colors.BOLD}Auto-sort complete! Check the War Room Active Pipeline.{Colors.ENDC}\n")
    await client.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
