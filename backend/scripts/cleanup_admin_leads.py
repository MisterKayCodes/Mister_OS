import os
import sys
from dotenv import load_dotenv

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy.orm import Session
from sqlalchemy import func
from data import models, database

load_dotenv()

def cleanup_admin_leads():
    print("Starting cleanup of admin_leads...")
    db = database.SessionLocal()
    try:
        # Get all admin leads
        admins = db.query(models.AdminLead).all()
        deleted_count = 0
        
        # Get all CRM leads with normalised usernames for fast lookup
        leads = db.query(models.Lead).all()
        lead_usernames = {
            lead.username.strip().lstrip("@").lower(): lead.status
            for lead in leads if lead.username
        }

        for admin in admins:
            if not admin.username:
                continue
                
            norm_username = admin.username.strip().lstrip("@").lower()
            
            # Check if this admin is already in the CRM leads pipeline
            if norm_username in lead_usernames:
                status = lead_usernames[norm_username]
                print(f"Deleting AdminLead '{admin.username}' - Already in CRM as '{status}'")
                db.delete(admin)
                deleted_count += 1
                
        db.commit()
        print(f"Cleanup complete. Deleted {deleted_count} duplicate admin leads.")
        
    except Exception as e:
        print(f"Error during cleanup: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    cleanup_admin_leads()
