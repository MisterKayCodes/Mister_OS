import os
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from data import models, database

load_dotenv()

def migrate_manual_admins():
    print("Starting data migration for manual admins...")
    db = database.SessionLocal()
    try:
        admins = db.query(models.AdminLead).filter(models.AdminLead.username.like("MANUAL:%")).all()
        count = 0
        for admin in admins:
            # Move to manual review
            if admin.status == "fresh":
                admin.status = "manual_review"
            # Try to link channel
            if not admin.channel_id:
                channel_username = admin.username.replace("MANUAL:", "")
                ch = db.query(models.ScrapedChannel).filter(
                    (models.ScrapedChannel.username == channel_username) | 
                    (models.ScrapedChannel.tg_id == channel_username)
                ).first()
                if ch:
                    admin.channel_id = ch.id
                    print(f"Linked {admin.username} to channel {ch.username or ch.tg_id}")
            count += 1
        db.commit()
        print(f"Migration complete. Successfully updated {count} admin leads.")
    except Exception as e:
        print(f"Error migrating: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    migrate_manual_admins()
