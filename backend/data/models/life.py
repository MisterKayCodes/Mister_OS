from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from data.models.base import Base

class LifeUserProgress(Base):
    __tablename__ = "life_user_progress"
    id = Column(Integer, primary_key=True, index=True)
    total_xp = Column(Float, default=0.0)
    silver_keys = Column(Integer, default=0)
    gold_keys = Column(Integer, default=0)
    platinum_keys = Column(Integer, default=0)
    current_streak = Column(Integer, default=0)
    last_action_date = Column(DateTime(timezone=True), nullable=True)

class LifeTaskDef(Base):
    __tablename__ = "life_task_defs"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    category = Column(String)  # 'Body Floor', 'Work Gate', 'Important', 'Rotation', 'Prospect'
    base_xp = Column(Float, default=0.0)
    target_minutes = Column(Integer, nullable=True)
    is_timed = Column(Boolean, default=True)
    fast_bonus_xp = Column(Float, default=0.0)
    order_index = Column(Integer, default=0)

class LifeTaskSession(Base):
    __tablename__ = "life_task_sessions"
    id = Column(Integer, primary_key=True, index=True)
    task_def_id = Column(Integer, ForeignKey("life_task_defs.id"))
    start_time = Column(DateTime(timezone=True), server_default=func.now())
    end_time = Column(DateTime(timezone=True), nullable=True)
    duration_minutes = Column(Float, default=0.0)
    xp_earned = Column(Float, default=0.0)
    is_completed = Column(Boolean, default=False)
    date_logged = Column(DateTime(timezone=True), server_default=func.now())
    
    task_def = relationship("LifeTaskDef")

class LifeReward(Base):
    __tablename__ = "life_rewards"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    cost_keys = Column(Integer, default=1)
    key_type = Column(String) # 'Silver', 'Gold', 'Platinum'
    session_minutes = Column(Integer, default=0)
    order_index = Column(Integer, default=0)

class LifeRewardUnlock(Base):
    __tablename__ = "life_reward_unlocks"
    id = Column(Integer, primary_key=True, index=True)
    reward_id = Column(Integer, ForeignKey("life_rewards.id"))
    key_type_spent = Column(String)
    keys_spent = Column(Integer, default=1)
    unlocked_at = Column(DateTime(timezone=True), server_default=func.now())
