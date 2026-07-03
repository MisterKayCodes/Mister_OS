from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from ..database import Base

class Lead(Base):
    __tablename__ = "leads"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    channel_username = Column(String, nullable=True)
    status = Column(String, default="Fresh")
    score = Column(String, nullable=True)
    auto_pilot = Column(Boolean, default=False)
    first_contact_at = Column(DateTime(timezone=True), nullable=True)
    last_our_message_at = Column(DateTime(timezone=True), nullable=True)
    last_their_message_at = Column(DateTime(timezone=True), nullable=True)
    read_receipt_seen = Column(Boolean, default=False)
    follow_up_sent = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

class LeadSummary(Base):
    __tablename__ = "lead_summaries"
    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), unique=True, nullable=False)
    summary = Column(Text, nullable=False)
    message_count = Column(Integer, default=0)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

class LeadInteraction(Base):
    __tablename__ = "lead_interactions"
    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=False)
    role = Column(String)
    content = Column(Text)
    is_draft = Column(Boolean, default=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class ChatTranscript(Base):
    __tablename__ = "chat_transcripts"
    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=False)
    transcript = Column(Text, nullable=False)
    scraped_at = Column(DateTime(timezone=True), server_default=func.now())