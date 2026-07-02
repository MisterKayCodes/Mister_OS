# Rule: Max 200 lines per file — split if exceeded
# MEMORY: SQLAlchemy Models

from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from .database import Base

class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, default="Untitled Note")
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Integer, nullable=False)
    description = Column(String, nullable=False)
    note_id = Column(Integer, index=True, nullable=True) # Link back to the note
    created_at = Column(DateTime(timezone=True), server_default=func.now())

