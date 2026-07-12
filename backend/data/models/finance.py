from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from ..database import Base

class Wallet(Base):
    __tablename__ = "wallets"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    type = Column(String)
    balance = Column(Integer, default=0)
    opening_balance = Column(Integer, default=0)
    color = Column(String, default="#3b82f6")

class Loan(Base):
    __tablename__ = "loans"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    principal_amount = Column(Integer)
    repayment_amount = Column(Integer)
    payment_type = Column(String) # 'one-time', 'installments'
    amount_paid = Column(Integer, default=0)
    settled = Column(Boolean, default=False)
    wallet_id = Column(Integer, nullable=True) # Wallet the principal went into / payments come from initially
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    from sqlalchemy.orm import relationship
    installments = relationship("LoanInstallment", back_populates="loan", cascade="all, delete-orphan")

class LoanInstallment(Base):
    __tablename__ = "loan_installments"
    id = Column(Integer, primary_key=True, index=True)
    loan_id = Column(Integer, ForeignKey("loans.id"))
    amount_due = Column(Integer)
    due_date = Column(DateTime(timezone=True))
    status = Column(String, default="pending") # pending, paid
    
    from sqlalchemy.orm import relationship
    loan = relationship("Loan", back_populates="installments")

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
    tags = Column(String, nullable=True)  # comma-separated hashtags e.g. "food,transport"
    time = Column(String, nullable=True)  # e.g. "3:45 PM"
    wallet_id = Column(Integer, nullable=True)
    note_id = Column(Integer, nullable=True)
    date = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class TransactionTemplate(Base):
    __tablename__ = "transaction_templates"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    type = Column(String)  # 'expense', 'income', 'save'
    amount_naira = Column(Integer)
    description = Column(String)
    category = Column(String)
    tags = Column(String, nullable=True)
    wallet_id = Column(Integer, nullable=True)
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

class Subscription(Base):
    __tablename__ = "subscriptions"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    amount = Column(Integer)
    cycle = Column(String) # 'monthly', 'weekly', 'yearly'
    next_due_date = Column(DateTime(timezone=True))
    wallet_id = Column(Integer, nullable=True)
    auto_deduct = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class FinanceSettings(Base):
    __tablename__ = "finance_settings"
    id = Column(Integer, primary_key=True, index=True)
    savings_rate = Column(Integer, default=0)
    default_wallet_id = Column(Integer, nullable=True)
    savings_wallet_id = Column(Integer, nullable=True)