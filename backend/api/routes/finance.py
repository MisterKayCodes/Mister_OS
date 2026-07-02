from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from data import models, database, schemas
from api.dependencies import get_master_token

router = APIRouter(prefix="/api/finance", tags=["Finance"])

# --- Request schemas (input only, live here since they're route-specific) ---
class WalletCreate(BaseModel):
    name: str
    type: str  # liquid, locked, investment
    color: str
    balance: Optional[int] = 0

class WalletDeposit(BaseModel):
    amount: int

class GoalCreate(BaseModel):
    name: str
    price_min: int
    price_max: Optional[int] = None
    wallet_id: Optional[int] = None

class DebtCreate(BaseModel):
    direction: str  # i_owe, they_owe
    person: str
    amount: int
    description: str

# --- Overview ---
@router.get("/overview")
def get_overview(db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    wallets = db.query(models.Wallet).all()
    net_worth = sum(w.balance for w in wallets)
    now = datetime.now()
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
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

# --- Transactions ---
@router.get("/transactions", response_model=List[schemas.TransactionResponse])
def get_transactions(db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    return db.query(models.Transaction).order_by(models.Transaction.date.desc()).all()

# --- Wallets ---
@router.get("/wallets", response_model=List[schemas.WalletResponse])
def get_wallets(db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    return db.query(models.Wallet).all()

@router.post("/wallets", response_model=schemas.WalletResponse)
def create_wallet(req: WalletCreate, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    w = models.Wallet(name=req.name, type=req.type, color=req.color, balance=req.balance)
    db.add(w)
    db.commit()
    db.refresh(w)
    return w

@router.put("/wallets/{wallet_id}/deposit")
def deposit_to_wallet(wallet_id: int, req: WalletDeposit, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    w = db.query(models.Wallet).filter(models.Wallet.id == wallet_id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Wallet not found")
    w.balance += req.amount
    db.commit()
    return {"message": "Balance updated", "balance": w.balance}

@router.delete("/wallets/{wallet_id}")
def delete_wallet(wallet_id: int, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    w = db.query(models.Wallet).filter(models.Wallet.id == wallet_id).first()
    if w:
        db.delete(w)
        db.commit()
    return {"message": "Wallet deleted"}

# --- Goals ---
@router.get("/goals", response_model=List[schemas.GoalResponse])
def get_goals(db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    return db.query(models.Goal).all()

@router.post("/goals", response_model=schemas.GoalResponse)
def create_goal(req: GoalCreate, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    g = models.Goal(name=req.name, price_min=req.price_min, price_max=req.price_max, wallet_id=req.wallet_id)
    db.add(g)
    db.commit()
    db.refresh(g)
    return g

@router.put("/goals/{goal_id}/achieve")
def achieve_goal(goal_id: int, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    g = db.query(models.Goal).filter(models.Goal.id == goal_id).first()
    if not g:
        raise HTTPException(status_code=404, detail="Goal not found")
    g.achieved = True
    db.commit()
    return {"message": "Goal achieved!"}

@router.delete("/goals/{goal_id}")
def delete_goal(goal_id: int, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    g = db.query(models.Goal).filter(models.Goal.id == goal_id).first()
    if g:
        db.delete(g)
        db.commit()
    return {"message": "Goal deleted"}

# --- Debts ---
@router.get("/debts", response_model=List[schemas.DebtResponse])
def get_debts(db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    return db.query(models.Debt).filter(models.Debt.settled == False).all()

@router.post("/debts", response_model=schemas.DebtResponse)
def create_debt(req: DebtCreate, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    d = models.Debt(direction=req.direction, person=req.person, amount=req.amount, description=req.description)
    db.add(d)
    db.commit()
    db.refresh(d)
    return d

@router.put("/debts/{debt_id}/settle")
def settle_debt(debt_id: int, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    d = db.query(models.Debt).filter(models.Debt.id == debt_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Debt not found")
    d.settled = True
    db.commit()
    return {"message": "Debt settled"}

# --- Price DB ---
@router.get("/price-db", response_model=List[schemas.PriceDbItem])
def get_price_db(db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    products = db.query(models.Product).all()
    results = []
    for p in products:
        logs = db.query(models.PriceLog).filter(models.PriceLog.product_id == p.id).order_by(models.PriceLog.date.desc()).all()
        if not logs:
            continue
        
        latest_log = logs[0]
        latest_vendor = db.query(models.Vendor).filter(models.Vendor.id == latest_log.vendor_id).first()
        
        prev_price = None
        price_changed_date = None
        for log in logs[1:]:
            if log.price != latest_log.price:
                prev_price = log.price
                price_changed_date = latest_log.date
                break
                
        results.append(schemas.PriceDbItem(
            product=p,
            latest_price=latest_log.price,
            latest_vendor=latest_vendor,
            previous_price=prev_price,
            price_changed_date=price_changed_date
        ))
    return results

@router.post("/vendors", response_model=schemas.VendorResponse)
def create_vendor(req: schemas.VendorBase, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    v = db.query(models.Vendor).filter(models.Vendor.name.ilike(req.name)).first()
    if v: return v
    v = models.Vendor(name=req.name)
    db.add(v)
    db.commit()
    db.refresh(v)
    return v

@router.get("/vendors", response_model=List[schemas.VendorResponse])
def get_vendors(db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    return db.query(models.Vendor).all()

@router.post("/products", response_model=schemas.ProductResponse)
def create_product(req: schemas.ProductBase, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    p = db.query(models.Product).filter(models.Product.name.ilike(req.name)).first()
    if p: return p
    p = models.Product(name=req.name, category=req.category)
    db.add(p)
    db.commit()
    db.refresh(p)
    return p

@router.post("/price-logs", response_model=schemas.PriceLogResponse)
def create_price_log(req: schemas.PriceLogCreate, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    log = models.PriceLog(product_id=req.product_id, vendor_id=req.vendor_id, price=req.price)
    db.add(log)
    db.commit()
    db.refresh(log)
    return log
