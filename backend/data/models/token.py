from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from ..database import Base

class TokenUsageLog(Base):
    __tablename__ = "token_usage_logs"
    id = Column(Integer, primary_key=True, index=True)
    task_name = Column(String, nullable=False)
    prompt_tokens = Column(Integer, default=0)
    completion_tokens = Column(Integer, default=0)
    total_tokens = Column(Integer, default=0)
    model = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())