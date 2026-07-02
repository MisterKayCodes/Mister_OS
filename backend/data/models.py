# Rule: Max 200 lines per file — split if exceeded
# MEMORY: SQLAlchemy Models

from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Boolean, ForeignKey
from sqlalchemy.sql import func
from .database import Base

class Folder(Base):
    __tablename__ = "folders"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, default="Untitled Note")
    content = Column(Text, nullable=False)
    folder_id = Column(Integer, ForeignKey("folders.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Integer, nullable=False)
    description = Column(String, nullable=False)
    note_id = Column(Integer, index=True, nullable=True) # Link back to the note
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ChatSession(Base):
    __tablename__ = "chat_sessions"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, default="New Chat")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, index=True, nullable=False)
    role = Column(String, nullable=False) # 'user' or 'assistant'
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Wallet(Base):
    __tablename__ = "wallets"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    type = Column(String) # liquid, locked, investment
    balance = Column(Integer, default=0)
    color = Column(String, default="#3b82f6")

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String) # expense, income, save
    amount_naira = Column(Integer)
    original_amount = Column(Float, nullable=True)
    original_currency = Column(String, default="NGN")
    exchange_rate = Column(Float, default=1.0)
    description = Column(String)
    category = Column(String)
    wallet_id = Column(Integer, nullable=True)
    note_id = Column(Integer, nullable=True)
    date = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Goal(Base):
    __tablename__ = "goals"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    price_min = Column(Integer)
    price_max = Column(Integer, nullable=True)
    wallet_id = Column(Integer, nullable=True)
    achieved = Column(Boolean, default=False)

class Debt(Base):
    __tablename__ = "debts"
    id = Column(Integer, primary_key=True, index=True)
    direction = Column(String) # i_owe, they_owe
    person = Column(String)
    amount = Column(Integer)
    description = Column(String)
    settled = Column(Boolean, default=False)
    date = Column(DateTime(timezone=True), server_default=func.now())

class BudgetCap(Base):
    __tablename__ = "budget_caps"
    id = Column(Integer, primary_key=True, index=True)
    category = Column(String)
    monthly_limit = Column(Integer)

class FinanceSettings(Base):
    __tablename__ = "finance_settings"
    id = Column(Integer, primary_key=True, index=True)
    savings_rate = Column(Integer, default=0)
    default_wallet_id = Column(Integer, nullable=True)
    savings_wallet_id = Column(Integer, nullable=True)

class AuthSession(Base):
    __tablename__ = "auth_sessions"
    id = Column(Integer, primary_key=True, index=True)
    token = Column(String, unique=True, index=True, nullable=False)
    device_name = Column(String, nullable=False)
    ip_address = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_active = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class Vendor(Base):
    __tablename__ = "vendors"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    category = Column(String, default="uncategorized")

class PriceLog(Base):
    __tablename__ = "price_logs"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, nullable=False)
    vendor_id = Column(Integer, nullable=False)
    price = Column(Integer, nullable=False)
    date = Column(DateTime(timezone=True), server_default=func.now())


