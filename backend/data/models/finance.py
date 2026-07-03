from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from ..database import Base

class Wallet(Base):
    __tablename__ = "wallets"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    type = Column(String)
    balance = Column(Integer, default=0)
    color = Column(String, default="#3b82f6")

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String)
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
    direction = Column(String)
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