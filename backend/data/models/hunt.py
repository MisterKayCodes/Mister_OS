from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from ..database import Base

class HuntedChannel(Base):
    __tablename__ = "hunted_channels"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=True)
    scanned_at = Column(DateTime(timezone=True), server_default=func.now())

class ScrapedChannel(Base):
    __tablename__ = "scraped_channels"
    id = Column(Integer, primary_key=True, index=True)
    tg_id = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=True)
    title = Column(String, nullable=True)
    members_count = Column(Integer, nullable=True)
    source_channel = Column(String, nullable=True)
    status = Column(String, default="pending")
    scanned_at = Column(DateTime(timezone=True), server_default=func.now())

class AdminLead(Base):
    __tablename__ = "admin_leads"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    channel_id = Column(Integer, ForeignKey("scraped_channels.id"), nullable=True)
    source = Column(String, default="description")
    status = Column(String, default="fresh")
    contacted_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())