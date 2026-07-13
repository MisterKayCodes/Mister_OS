from sqlalchemy.orm import Session
from data import models, schemas
from datetime import datetime, timezone, timedelta
import math

class LifeService:
    
    # ========== HELPERS: Total Silver System ==========
    
    @staticmethod
    def _keys_to_silver(platinum: int, gold: int, silver: int) -> int:
        """Convert keys to raw silver value. 1 Plat=4, 1 Gold=2, 1 Silver=1"""
        return (platinum * 4) + (gold * 2) + silver
    
    @staticmethod
    def _silver_to_keys(total_silver: int) -> tuple:
        """Convert raw silver to highest keys. Returns (platinum, gold, silver)"""
        platinum = total_silver // 4
        remainder = total_silver % 4
        gold = remainder // 2
        silver = remainder % 2
        return platinum, gold, silver
    
    @staticmethod
    def _redistribute_keys(progress: models.LifeUserProgress) -> None:
        """Auto-upgrade: convert all keys to silver, then redistribute highest"""
        total = LifeService._keys_to_silver(
            progress.platinum_keys,
            progress.gold_keys,
            progress.silver_keys
        )
        progress.platinum_keys, progress.gold_keys, progress.silver_keys = LifeService._silver_to_keys(total)
    
    # ========== GET PROGRESS ==========
    
    @staticmethod
    def get_progress(db: Session) -> models.LifeUserProgress:
        """Fetch or create user progress"""
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
    
    # ========== EARN XP ==========
    
    @staticmethod
    def log_task_session(db: Session, data: schemas.LifeTaskSessionCreate) -> models.LifeUserProgress:
        """Log task completion, award XP, auto-mint keys using Total Silver method"""
        # Create session record
        session = models.LifeTaskSession(**data.dict())
        db.add(session)
        
        # Get progress
        progress = LifeService.get_progress(db)
        old_xp = progress.total_xp
        progress.total_xp += session.xp_earned
        new_xp = progress.total_xp
        
        # Calculate how many 60-XP milestones were crossed
        old_60s = int(old_xp // 60)
        new_60s = int(new_xp // 60)
        silver_earned = new_60s - old_60s
        
        # Convert all current keys to total silver
        total_silver = LifeService._keys_to_silver(
            progress.platinum_keys,
            progress.gold_keys,
            progress.silver_keys
        )
        
        # Add newly earned silver
        total_silver += silver_earned
        
        # Redistribute into highest keys (auto-upgrade)
        progress.platinum_keys, progress.gold_keys, progress.silver_keys = LifeService._silver_to_keys(total_silver)
        
        # Update timestamp
        progress.last_action_date = datetime.now(timezone.utc)
        db.commit()
        db.refresh(progress)
        return progress
    
    # ========== SPEND KEYS (with Auto-Change) ==========
    
    @staticmethod
    def unlock_reward(db: Session, data: schemas.LifeRewardUnlockCreate):
        """Unlock reward, spend keys with auto-change via Total Silver method"""
        progress = LifeService.get_progress(db)
        
        # Convert cost to silver
        if data.key_type_spent == "Platinum":
            cost = data.keys_spent * 4
        elif data.key_type_spent == "Gold":
            cost = data.keys_spent * 2
        elif data.key_type_spent == "Silver":
            cost = data.keys_spent
        else:
            raise ValueError("Invalid key type")
        
        # Convert all current keys to total silver
        total_silver = LifeService._keys_to_silver(
            progress.platinum_keys,
            progress.gold_keys,
            progress.silver_keys
        )
        
        # Check if user can afford
        if total_silver < cost:
            raise ValueError(f"Not enough keys. Need {cost} silver, have {total_silver}")
        
        # Subtract cost
        total_silver -= cost
        
        # Redistribute change into highest keys (auto-change)
        progress.platinum_keys, progress.gold_keys, progress.silver_keys = LifeService._silver_to_keys(total_silver)
        
        # Record the unlock
        unlock = models.LifeRewardUnlock(**data.dict())
        db.add(unlock)
        db.commit()
        db.refresh(progress)
        return progress
    
    # ========== NIGHTLY PENALTY SYSTEM ==========
    
    @staticmethod
    def run_nightly_cron(db: Session):
        """Run nightly: apply inactivity penalties, reset daily tasks"""
        progress = LifeService.get_progress(db)
        
        now = datetime.now(timezone.utc)
        
        if progress.last_action_date:
            days_since = (now.date() - progress.last_action_date.date()).days
            if days_since >= 2:
                # Missed 2 days: lose Silver keys
                progress.silver_keys = 0
                # Redistribute after losing Silvers (auto-upgrade remaining)
                LifeService._redistribute_keys(progress)
            if days_since >= 3:
                # Missed 3 days: streak resets
                progress.current_streak = 0
        
        # Reset daily task completion flags
        db.query(models.LifeTaskSession).update({models.LifeTaskSession.is_completed: False})
        
        db.commit()