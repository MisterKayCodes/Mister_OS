#!/usr/bin/env python3
"""
migrate_system_prompt.py
Run once on the VPS to add the system_prompt column to outreach_brain table.
Usage: python3 backend/scripts/migrate_system_prompt.py
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'mister_os.db')
DB_PATH = os.path.abspath(DB_PATH)

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if column already exists
    cursor.execute("PRAGMA table_info(outreach_brain)")
    columns = [row[1] for row in cursor.fetchall()]
    
    if 'system_prompt' not in columns:
        print("[+] Adding 'system_prompt' column to outreach_brain table...")
        cursor.execute("ALTER TABLE outreach_brain ADD COLUMN system_prompt TEXT")
        conn.commit()
        print("[✓] Migration complete!")
    else:
        print("[=] Column 'system_prompt' already exists. Nothing to do.")
    
    conn.close()

if __name__ == "__main__":
    migrate()
