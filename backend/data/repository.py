from sqlalchemy.orm import Session
from typing import List, Optional, Any
from . import models

class NoteRepository:
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[models.Note]:
        return db.query(models.Note).order_by(models.Note.updated_at.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def get_by_id(db: Session, note_id: int) -> Optional[models.Note]:
        return db.query(models.Note).filter(models.Note.id == note_id).first()

    @staticmethod
    def get_by_title(db: Session, title: str) -> Optional[models.Note]:
        return db.query(models.Note).filter(models.Note.title == title).first()

    @staticmethod
    def create(db: Session, title: str, content: str, folder_id: Optional[int] = None) -> models.Note:
        note = models.Note(title=title, content=content, folder_id=folder_id)
        db.add(note)
        db.commit()
        db.refresh(note)
        return note

    @staticmethod
    def update(db: Session, note: models.Note) -> models.Note:
        db.commit()
        db.refresh(note)
        return note

    @staticmethod
    def delete(db: Session, note: models.Note):
        db.delete(note)
        db.commit()

class FinanceRepository:
    @staticmethod
    def get_transactions_by_note(db: Session, note_id: int) -> List[models.Transaction]:
        return db.query(models.Transaction).filter(models.Transaction.note_id == note_id).all()

    @staticmethod
    def delete_transactions_by_note(db: Session, note_id: int):
        db.query(models.Transaction).filter(models.Transaction.note_id == note_id).delete()
        db.commit()

    @staticmethod
    def create_transaction(db: Session, tx_data: dict) -> models.Transaction:
        tx = models.Transaction(**tx_data)
        db.add(tx)
        db.commit()
        db.refresh(tx)
        return tx

    @staticmethod
    def get_product_by_name(db: Session, name: str) -> Optional[models.Product]:
        return db.query(models.Product).filter(models.Product.name.ilike(name)).first()
    
    @staticmethod
    def create_product(db: Session, name: str, category: str = "uncategorized") -> models.Product:
        p = models.Product(name=name, category=category)
        db.add(p)
        db.commit()
        db.refresh(p)
        return p

    @staticmethod
    def get_vendor_by_name(db: Session, name: str) -> Optional[models.Vendor]:
        return db.query(models.Vendor).filter(models.Vendor.name.ilike(name)).first()
    
    @staticmethod
    def create_vendor(db: Session, name: str) -> models.Vendor:
        v = models.Vendor(name=name)
        db.add(v)
        db.commit()
        db.refresh(v)
        return v

    @staticmethod
    def create_price_log(db: Session, product_id: int, vendor_id: int, price: int) -> models.PriceLog:
        plog = models.PriceLog(product_id=product_id, vendor_id=vendor_id, price=price)
        db.add(plog)
        db.commit()
        db.refresh(plog)
        return plog

class ChatRepository:
    @staticmethod
    def create_session(db: Session, title: str) -> models.ChatSession:
        db_session = models.ChatSession(title=title)
        db.add(db_session)
        db.commit()
        db.refresh(db_session)
        return db_session

    @staticmethod
    def get_history(db: Session, session_id: int, limit: int = 10) -> List[models.ChatMessage]:
        messages = db.query(models.ChatMessage).filter(models.ChatMessage.session_id == session_id).order_by(models.ChatMessage.id.desc()).limit(limit).all()
        return list(reversed(messages))

    @staticmethod
    def create_message(db: Session, session_id: int, role: str, content: str) -> models.ChatMessage:
        msg = models.ChatMessage(session_id=session_id, role=role, content=content)
        db.add(msg)
        db.commit()
        db.refresh(msg)
        return msg

class LeadRepository:
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[models.Lead]:
        return db.query(models.Lead).order_by(models.Lead.updated_at.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def get_by_username(db: Session, username: str) -> Optional[models.Lead]:
        return db.query(models.Lead).filter(models.Lead.username == username).first()

    @staticmethod
    def create(db: Session, lead_data: dict) -> models.Lead:
        lead = models.Lead(**lead_data)
        db.add(lead)
        db.commit()
        db.refresh(lead)
        return lead
    
    @staticmethod
    def update(db: Session, lead: models.Lead) -> models.Lead:
        db.commit()
        db.refresh(lead)
        return lead

    @staticmethod
    def check_if_hunted(db: Session, username: str) -> bool:
        return db.query(models.HuntedChannel).filter(models.HuntedChannel.username == username).first() is not None

    @staticmethod
    def mark_hunted(db: Session, username: str, title: str = None) -> models.HuntedChannel:
        hc = models.HuntedChannel(username=username, title=title)
        db.add(hc)
        db.commit()
        db.refresh(hc)
        return hc
