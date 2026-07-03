# Rule: Max 200 lines per file — split if exceeded
# MEMORY: SQLAlchemy Models

from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Boolean, ForeignKey
from sqlalchemy.sql import func
from .database import Base

class SearchLog(Base):
    __tablename__ = "search_logs"
    id = Column(Integer, primary_key=True, index=True)
    query = Column(String, nullable=False)
    channels_found = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class AnalysisReport(Base):
    __tablename__ = "analysis_reports"
    id = Column(Integer, primary_key=True, index=True)
    working_patterns = Column(Text, nullable=False)
    killing_patterns = Column(Text, nullable=False)
    pain_points = Column(Text, nullable=False)
    top_openers = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class TokenUsageLog(Base):
    __tablename__ = "token_usage_logs"
    id = Column(Integer, primary_key=True, index=True)
    task_name = Column(String, nullable=False)       # e.g. omni_chat, analyse_all, generate_title
    prompt_tokens = Column(Integer, default=0)
    completion_tokens = Column(Integer, default=0)
    total_tokens = Column(Integer, default=0)
    model = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

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

class Lead(Base):
    __tablename__ = "leads"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    channel_username = Column(String, nullable=True)
    status = Column(String, default="Fresh")  # Fresh | Pitching | Follow-up | Hot | Dead
    score = Column(String, nullable=True)
    auto_pilot = Column(Boolean, default=False)
    # --- Timestamp Tracking (State Machine Engine) ---
    first_contact_at = Column(DateTime(timezone=True), nullable=True)
    last_our_message_at = Column(DateTime(timezone=True), nullable=True)
    last_their_message_at = Column(DateTime(timezone=True), nullable=True)
    read_receipt_seen = Column(Boolean, default=False)
    follow_up_sent = Column(Boolean, default=False)
    # -------------------------------------------------
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

class LeadSummary(Base):
    __tablename__ = "lead_summaries"
    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), unique=True, nullable=False)
    summary = Column(Text, nullable=False)
    message_count = Column(Integer, default=0)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

class HuntedChannel(Base):
    __tablename__ = "hunted_channels"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=True)
    scanned_at = Column(DateTime(timezone=True), server_default=func.now())

class LeadInteraction(Base):
    __tablename__ = "lead_interactions"
    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=False)
    role = Column(String)
    content = Column(Text)
    is_draft = Column(Boolean, default=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class ScrapedChannel(Base):
    """A Telegram channel that was found via the Hunt worker."""
    __tablename__ = "scraped_channels"
    id = Column(Integer, primary_key=True, index=True)
    tg_id = Column(String, unique=True, index=True, nullable=False)  # Telegram channel numeric ID
    username = Column(String, unique=True, index=True, nullable=True)  # @username
    title = Column(String, nullable=True)
    members_count = Column(Integer, nullable=True)
    source_channel = Column(String, nullable=True)  # Which seed channel it was found from
    status = Column(String, default="pending")  # pending | scanned | dead
    scanned_at = Column(DateTime(timezone=True), server_default=func.now())

class AdminLead(Base):
    """An admin username extracted from a scraped channel."""
    __tablename__ = "admin_leads"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    channel_id = Column(Integer, ForeignKey("scraped_channels.id"), nullable=True)
    source = Column(String, default="description")  # description | posts | manual
    status = Column(String, default="fresh")  # fresh | outreach_sent | active | dead | closed | manual_review
    contacted_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class OutreachLog(Base):
    """Log of every outreach message sent."""
    __tablename__ = "outreach_logs"
    id = Column(Integer, primary_key=True, index=True)
    admin_lead_id = Column(Integer, ForeignKey("admin_leads.id"), nullable=False)
    message_variant = Column(Integer, nullable=True)  # Which of the templates was used
    content = Column(Text, nullable=False)
    sent_at = Column(DateTime(timezone=True), server_default=func.now())

class OutreachTemplate(Base):
    """User-created or AI-generated outreach templates."""
    __tablename__ = "outreach_templates"
    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)  # The template text containing {name}
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ChatTranscript(Base):
    """Stores full scraped chat history for AI analysis."""
    __tablename__ = "chat_transcripts"
    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=False)
    transcript = Column(Text, nullable=False)
    scraped_at = Column(DateTime(timezone=True), server_default=func.now())

class CrmSettings(Base):
    """Global CRM settings editable from the UI."""
    __tablename__ = "crm_settings"
    id = Column(Integer, primary_key=True, index=True)
    boss_alert_username = Column(String, default="opozdal96")  # Without @
    outreach_active = Column(Boolean, default=False)
    min_delay_minutes = Column(Integer, default=30)
    max_delay_minutes = Column(Integer, default=120)
    next_outreach_run = Column(DateTime(timezone=True), nullable=True) # Delay memory
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())


