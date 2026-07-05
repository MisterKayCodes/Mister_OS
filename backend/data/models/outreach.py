from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON
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
    delay_mode = Column(String, default="balanced")  # safe | balanced | aggressive
    auto_mode = Column(Boolean, default=False)        # Future: fully automatic
    next_outreach_run = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

class OutreachBrain(Base):
    """Living AI knowledge base — stores sales advice and learns from corrections."""
    __tablename__ = "outreach_brain"
    id = Column(Integer, primary_key=True, index=True)
    system_prompt = Column(Text, nullable=True)       # Core AI persona & pitch rules (editable)
    advice_text = Column(Text, nullable=True)         # The green/red/pain point analysis
    correction_log = Column(JSON, default=list)       # [{original, corrected, reason}]
    generated_count = Column(Integer, default=0)
    last_updated = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

class OutreachQueue(Base):
    """Holds AI-generated openers waiting for review before sending."""
    __tablename__ = "outreach_queue"
    id = Column(Integer, primary_key=True, index=True)
    admin_lead_id = Column(Integer, ForeignKey("admin_leads.id"), nullable=False)
    generated_message = Column(Text, nullable=False)
    edited_message = Column(Text, nullable=True)     # Set if user edited before approving
    was_edited = Column(Boolean, default=False)
    status = Column(String, default="pending")       # pending | approved | sent | skipped
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    approved_at = Column(DateTime(timezone=True), nullable=True)