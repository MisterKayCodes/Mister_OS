"""
hunt_worker.py
Scrapes similar Telegram channels, extracts admin usernames from descriptions and posts.
Sends results to the Mister OS backend.

Usage: python hunt_worker.py --seed @forex_ng --limit 10
"""
import asyncio
import re
import os
import argparse
import requests
from dotenv import load_dotenv
from telethon import TelegramClient
from telethon.tl.functions.channels import GetFullChannelRequest
from telethon.tl.functions.contacts import SearchRequest
from telethon.sessions import StringSession

env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))
load_dotenv(dotenv_path=env_path)

API_ID = os.getenv("API_ID")
API_HASH = os.getenv("API_HASH")
STRING_SESSION = os.getenv("STRING_SESSION", "")
SESSION_NAME = os.getenv("SESSION_NAME", "outreach_session")
BACKEND = os.getenv("MAIN_BACKEND_URL", "http://localhost:8011")

session_storage = StringSession(STRING_SESSION) if STRING_SESSION else SESSION_NAME
client = TelegramClient(session_storage, API_ID, API_HASH)

USERNAME_REGEX = re.compile(r'(?:t\.me/|@)([a-zA-Z][a-zA-Z0-9_]{4,})', re.IGNORECASE)

def post_channel(channel_data: dict):
    try:
        requests.post(f"{BACKEND}/api/hunts/channels/webhook", json=channel_data, timeout=10)
    except Exception as e:
        print(f"  [!] Backend channel post failed: {e}")

def post_admin(admin_data: dict):
    try:
        r = requests.post(f"{BACKEND}/api/hunts/admins/webhook", json=admin_data, timeout=10)
        return r.json()
    except Exception as e:
        print(f"  [!] Backend admin post failed: {e}")
        return {}

async def extract_admin_from_description(about: str, channel_id: int) -> list:
    """Regex search through the channel about/description text."""
    found = USERNAME_REGEX.findall(about or "")
    # Filter out obvious channel/bot names that aren't personal usernames
    return [u for u in found if len(u) > 4]

async def extract_admin_from_posts(entity, channel_db_id: int, post_limit: int = 50) -> list:
    """Fetch last N posts and scan for @mentions or t.me links."""
    found_usernames = set()
    print(f"    Scanning last {post_limit} posts...")
    # Add a small delay before fetching posts to be safe
    await asyncio.sleep(3)
    async for message in client.iter_messages(entity, limit=post_limit):
        if message.text:
            matches = USERNAME_REGEX.findall(message.text)
            for m in matches:
                found_usernames.add(m)
    return list(found_usernames)

async def process_channel(entity, seed_username: str):
    """Full pipeline: describe channel → extract admins → post to backend."""
    tg_id = str(entity.id)
    ch_username = getattr(entity, 'username', None)
    title = getattr(entity, 'title', 'Unknown')
    members = getattr(entity, 'participants_count', None)

    print(f"\n  Processing: {title} (@{ch_username}) — {members} members")

    # 1. Save the channel to backend
    channel_payload = {
        "tg_id": tg_id,
        "username": ch_username,
        "title": title,
        "members_count": members,
        "source_channel": seed_username
    }
    post_channel(channel_payload)

    # 2. Get channel description
    try:
        full = await client(GetFullChannelRequest(entity))
        about = full.full_chat.about or ""
    except Exception:
        about = ""

    # 3. Try to extract from description
    admins = await extract_admin_from_description(about, 0)
    source = "description"

    # 4. If nothing found, scan posts
    if not admins:
        admins = await extract_admin_from_posts(entity, 0, post_limit=50)
        source = "posts"

    # 5. Post found admins to backend
    if admins:
        for username in admins:
            result = post_admin({
                "username": username,
                "source": source,
                "channel_id": None  # backend assigns from tg_id lookup
            })
            status = result.get("status", "?")
            print(f"    Admin: @{username} [{source}] → {status}")
    else:
        # No admin found — mark for manual review
        post_admin({
            "username": f"MANUAL:{ch_username or tg_id}",
            "source": "manual",
            "channel_id": None
        })
        print(f"    No admin found → Manual Review")

    # Safety delay between channels (3-8 seconds)
    delay = 3 + (hash(tg_id) % 5)
    print(f"    Waiting {delay}s before next channel...")
    await asyncio.sleep(delay)

async def main(seed_channel: str, limit: int):
    await client.start()
    print(f"Hunt Worker started. Seed: {seed_channel}, Limit: {limit}")

    try:
        seed_entity = await client.get_entity(seed_channel)
    except Exception as e:
        print(f"Could not find seed channel '{seed_channel}': {e}")
        return

    print(f"Seed channel found: {getattr(seed_entity, 'title', seed_channel)}")

    # Search for similar channels by the seed channel's title keywords
    seed_title = getattr(seed_entity, 'title', seed_channel)
    keywords = seed_title.split()[:2]  # Use first 2 words as search query
    search_query = " ".join(keywords)

    print(f"Searching Telegram for channels like: '{search_query}'")
    await asyncio.sleep(2)  # Be polite before searching

    try:
        result = await client(SearchRequest(q=search_query, limit=limit))
        channels = [c for c in result.chats if hasattr(c, 'broadcast') or hasattr(c, 'megagroup')]
    except Exception as e:
        print(f"Search failed: {e}")
        channels = []

    if not channels:
        print("No similar channels found. Try a different seed or broader keyword.")
        return

    print(f"Found {len(channels)} similar channels. Processing up to {limit}...")

    for channel in channels[:limit]:
        try:
            await process_channel(channel, seed_channel)
        except Exception as e:
            print(f"  Error processing channel: {e}")

    print(f"\nHunt complete. Processed {min(len(channels), limit)} channels.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--seed", required=True, help="Seed channel username e.g. @forex_ng")
    parser.add_argument("--limit", type=int, default=10, help="Max channels to scan (default 10)")
    args = parser.parse_args()
    asyncio.run(main(args.seed, args.limit))
