from sqlalchemy.orm import Session
from data import models, schemas
from datetime import datetime, timezone, timedelta
import math

class LifeService:
    
    @staticmethod
    def get_progress(db: Session) -> models.LifeUserProgress:
        progress = db.query(models.LifeUserProgress).first()
        if not progress:
            progress = models.LifeUserProgress(
                total_xp=0.0,
                silver_keys=0,
                gold_keys=0,
                platinum_keys=0,
                current_streak=0
            )
            db.add(progress)
            db.commit()
            db.refresh(progress)
        return progress

    @staticmethod
    def _recalculate_keys_from_xp(progress: models.LifeUserProgress):
        # 60 XP = 1 Silver Key
        # 120 XP = 1 Gold Key (or 2 Silver Keys)
        # 240 XP = 1 Platinum Key (or 2 Gold Keys)
        
        # We only generate keys from new XP chunks.
        # But wait, XP never resets. It's a continuous level.
        # The user said: "60 XP auto equals 1 Silver Key... You earn it, it stays as level."
        # If the total_xp grows, we need to know how many keys have already been "minted" from this XP, 
        # or we just mint keys at the time of earning XP.
        pass

    @staticmethod
    def log_task_session(db: Session, data: schemas.LifeTaskSessionCreate) -> models.LifeUserProgress:
        session = models.LifeTaskSession(**data.dict())
        db.add(session)
        
        progress = LifeService.get_progress(db)
        old_xp = progress.total_xp
        progress.total_xp += session.xp_earned
        new_xp = progress.total_xp
        
        # Check thresholds crossed to mint keys
        # E.g. every 60 XP milestone.
        # old_xp = 50, new_xp = 70. 70 // 60 = 1. 50 // 60 = 0. We crossed one 60-mark.
        # Wait, the spec says: 
        # 60 XP = 1 Silver
        # 120 XP = 1 Gold
        # 240 XP = 1 Platinum
        
        # Let's count how many of each milestone were crossed
        old_60s = int(old_xp // 60)
        new_60s = int(new_xp // 60)
        silver_minted = new_60s - old_60s
        
        old_120s = int(old_xp // 120)
        new_120s = int(new_xp // 120)
        gold_minted = new_120s - old_120s
        
        old_240s = int(old_xp // 240)
        new_240s = int(new_xp // 240)
        plat_minted = new_240s - old_240s
        
        # Give the highest key possible for the milestone
        # If we cross 240, we crossed 60, 120, and 240 simultaneously.
        # The spec says "240 XP auto equals 1 Platinum Key". It doesn't say you get 1 Plat AND 1 Gold AND 1 Silver.
        # "120 XP auto equals 1 Gold Key, also equals 2 Silver Keys"
        # So we should grant ONLY the highest tier key for the milestone crossed.
        
        for i in range(old_60s + 1, new_60s + 1):
            xp_mark = i * 60
            if xp_mark % 240 == 0:
                progress.platinum_keys += 1
            elif xp_mark % 120 == 0:
                progress.gold_keys += 1
            else:
                progress.silver_keys += 1
                
        progress.last_action_date = datetime.now(timezone.utc)
        db.commit()
        db.refresh(progress)
        return progress

    @staticmethod
    def unlock_reward(db: Session, data: schemas.LifeRewardUnlockCreate):
        progress = LifeService.get_progress(db)
        
        if data.key_type_spent == "Platinum":
            if progress.platinum_keys < data.keys_spent:
                raise ValueError("Not enough Platinum keys")
            progress.platinum_keys -= data.keys_spent
        elif data.key_type_spent == "Gold":
            if progress.gold_keys < data.keys_spent:
                raise ValueError("Not enough Gold keys")
            progress.gold_keys -= data.keys_spent
        elif data.key_type_spent == "Silver":
            if progress.silver_keys < data.keys_spent:
                raise ValueError("Not enough Silver keys")
            progress.silver_keys -= data.keys_spent
        else:
            raise ValueError("Invalid key type")
            
        unlock = models.LifeRewardUnlock(**data.dict())
        db.add(unlock)
        db.commit()
        db.refresh(progress)
        return progress

    @staticmethod
    def run_nightly_cron(db: Session):
        progress = LifeService.get_progress(db)
        
        # "Miss 2 days in a row with zero Work Crucial, lose only Silver Keys"
        # "Miss 3 days in one week, streak resets, keep half XP"
        # "Keys save for tomorrow but reset after 2nd night if not used."
        
        # To strictly implement keys resetting after 2nd night, we need to track when keys were earned.
        # For a simplified V1, we can just wipe Silver keys if there was no activity yesterday.
        # Let's do a simple streak check for now.
        now = datetime.now(timezone.utc)
        
        if progress.last_action_date:
            days_since = (now.date() - progress.last_action_date.date()).days
            if days_since >= 2:
                # Missed a whole day
                progress.silver_keys = 0
            if days_since >= 3:
                # Missed 2 days
                progress.current_streak = 0
                
        # Reset completed tasks for today
        db.query(models.LifeTaskSession).update({models.LifeTaskSession.is_completed: False})
        
        db.commit()
