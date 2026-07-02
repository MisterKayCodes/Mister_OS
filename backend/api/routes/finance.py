from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from data import models, database, schemas
from api.dependencies import get_master_token

router = APIRouter(prefix="/api/finance", tags=["Finance"])

@router.get("/overview")
def get_overview(db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    wallets = db.query(models.Wallet).all()
    net_worth = sum(w.balance for w in wallets)
    
    # Current month stats
    now = datetime.now()
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0)
    txs = db.query(models.Transaction).filter(models.Transaction.date >= start_of_month).all()
    
    income = sum(t.amount_naira for t in txs if t.type == "income")
    expenses = sum(t.amount_naira for t in txs if t.type == "expense")
    saved = sum(t.amount_naira for t in txs if t.type == "save")
    
    return {
        "net_worth": net_worth,
        "month_income": income,
        "month_expenses": expenses,
        "month_saved": saved,
        "savings_rate": round((saved / income * 100), 1) if income > 0 else 0
    }

@router.get("/transactions", response_model=List[schemas.TransactionResponse])
def get_transactions(db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    return db.query(models.Transaction).order_by(models.Transaction.date.desc()).all()

@router.get("/wallets", response_model=List[schemas.WalletResponse])
def get_wallets(db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    return db.query(models.Wallet).all()

@router.post("/wallets")
def create_wallet(name: str, type: str, color: str, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    w = models.Wallet(name=name, type=type, color=color)
    db.add(w)
    db.commit()
    return {"message": "Wallet created"}

@router.get("/goals", response_model=List[schemas.GoalResponse])
def get_goals(db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    return db.query(models.Goal).all()
