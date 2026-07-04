import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), "data", "mister_os.db")

def migrate():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute("ALTER TABLE crm_settings ADD COLUMN delay_mode VARCHAR DEFAULT 'balanced'")
        print("Added delay_mode column.")
    except sqlite3.OperationalError as e:
        print(f"delay_mode column already exists or error: {e}")
        
    try:
        cursor.execute("ALTER TABLE crm_settings ADD COLUMN auto_mode BOOLEAN DEFAULT 0")
        print("Added auto_mode column.")
    except sqlite3.OperationalError as e:
        print(f"auto_mode column already exists or error: {e}")

    conn.commit()
    conn.close()
    print("Schema migration complete.")

if __name__ == "__main__":
    migrate()
