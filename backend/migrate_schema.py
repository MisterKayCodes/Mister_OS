"""
migrate_schema.py
Run this once on the VPS to fix the database schema:
- Adds delay_mode, auto_mode columns to crm_settings
- Creates outreach_brain table
- Creates outreach_queue table
"""
import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), "data", "mister_os.db")
print(f"Connecting to: {db_path}")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# ── 1. Add missing columns to crm_settings ────────────────────────────────────
for col, definition in [
    ("delay_mode", "VARCHAR DEFAULT 'balanced'"),
    ("auto_mode",  "BOOLEAN DEFAULT 0"),
]:
    try:
        cursor.execute(f"ALTER TABLE crm_settings ADD COLUMN {col} {definition}")
        print(f"[+] Added column crm_settings.{col}")
    except sqlite3.OperationalError:
        print(f"[=] Column crm_settings.{col} already exists — skipping")

# ── 2. Create outreach_brain table ─────────────────────────────────────────────
cursor.execute("""
    CREATE TABLE IF NOT EXISTS outreach_brain (
        id               INTEGER PRIMARY KEY AUTOINCREMENT,
        advice_text      TEXT,
        correction_log   TEXT DEFAULT '[]',
        generated_count  INTEGER DEFAULT 0,
        last_updated     DATETIME DEFAULT CURRENT_TIMESTAMP
    )
""")
print("[+] outreach_brain table ensured")

# ── 3. Create outreach_queue table ─────────────────────────────────────────────
cursor.execute("""
    CREATE TABLE IF NOT EXISTS outreach_queue (
        id                INTEGER PRIMARY KEY AUTOINCREMENT,
        admin_lead_id     INTEGER NOT NULL REFERENCES admin_leads(id),
        generated_message TEXT NOT NULL,
        edited_message    TEXT,
        was_edited        BOOLEAN DEFAULT 0,
        status            VARCHAR DEFAULT 'pending',
        created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
        approved_at       DATETIME
    )
""")
print("[+] outreach_queue table ensured")

conn.commit()
conn.close()
print("\n✅ Schema migration complete! Restart the backend service now.")
