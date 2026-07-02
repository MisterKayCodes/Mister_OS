import sqlite3
import os

def migrate():
    # Adjusted path because this script is inside backend/scripts and the actual DB is mister_os.db
    db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'mister_os.db')
    print(f"Connecting to DB at: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        cursor.execute('CREATE TABLE IF NOT EXISTS folders (id INTEGER PRIMARY KEY, name VARCHAR NOT NULL UNIQUE, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)')
        print("Ensured folders table exists.")
    except Exception as e:
        print(f"Error creating folders table: {e}")

    try:
        cursor.execute('ALTER TABLE notes ADD COLUMN folder_id INTEGER REFERENCES folders(id)')
        print("Migration successful: Added folder_id to notes.")
    except Exception as e:
        print(f"Migration failed or already applied: {e}")
        
    conn.commit()
    conn.close()

if __name__ == "__main__":
    migrate()
