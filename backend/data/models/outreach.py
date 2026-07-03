from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from ..database import Base

class OutreachLog(Base):
    __tablename__ = "outreach_logs"
    id = Column(Integer, primary_key=True, index=True)
    admin_lead_id = Column(Integer, ForeignKey("admin_leads.id"), nullable=False)
    message_variant = Column(Integer, nullable=True)
    content = Column(Text, nullable=False)
    sent_at = Column(DateTime(timezone=True), server_default=func.now())

class OutreachTemplate(Base):
    __tablename__ = "outreach_templates"
    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class CrmSettings(Base):
    __tablename__ = "crm_settings"
    id = Column(Integer, primary_key=True, index=True)
    boss_alert_username = Column(String, default="opozdal96")
    outreach_active = Column(Boolean, default=False)
    min_delay_minutes = Column(Integer, default=30)
    max_delay_minutes = Column(Integer, default=120)
    next_outreach_run = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())