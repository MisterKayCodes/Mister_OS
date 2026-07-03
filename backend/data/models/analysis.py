from sqlalchemy import Column, Integer, Text, DateTime
from sqlalchemy.sql import func
from ..database import Base

class AnalysisReport(Base):
    __tablename__ = "analysis_reports"
    id = Column(Integer, primary_key=True, index=True)
    working_patterns = Column(Text, nullable=False)
    killing_patterns = Column(Text, nullable=False)
    pain_points = Column(Text, nullable=False)
    top_openers = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())