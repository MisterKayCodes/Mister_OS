from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from data import models, database, schemas
from data.repository import FinanceRepository
from api.dependencies import get_master_token

router = APIRouter(prefix="/api/finance", tags=["Finance"])

# --- Request schemas (input only, live here since they're route-specific) ---
class WalletCreate(BaseModel):
    name: str
    type: str  # liquid, locked, investment
    color: str
    balance: Optional[int] = 0

class WalletUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    color: Optional[str] = None
    balance: Optional[int] = None

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

class DefaultWalletUpdate(BaseModel):
    wallet_id: Optional[int] = None

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

# --- Settings ---
@router.get("/settings")
def get_finance_settings(db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    settings = db.query(models.FinanceSettings).first()
    if not settings:
        settings = models.FinanceSettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@router.put("/settings/default-wallet")
def update_default_wallet(req: DefaultWalletUpdate, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    settings = db.query(models.FinanceSettings).first()
    if not settings:
        settings = models.FinanceSettings()
        db.add(settings)
    settings.default_wallet_id = req.wallet_id
    db.commit()
    db.refresh(settings)
    return settings

# --- Transactions ---
@router.get("/transactions", response_model=List[schemas.TransactionResponse])
def get_transactions(db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    return db.query(models.Transaction).order_by(models.Transaction.date.desc()).all()

@router.delete("/transactions/{tx_id}")
def delete_transaction(tx_id: int, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    tx = db.query(models.Transaction).filter(models.Transaction.id == tx_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    if tx.note_id:
        note = db.query(models.Note).filter(models.Note.id == tx.note_id).first()
        if note:
            # Re-parse to find the exact line to remove
            from core.parsers.finance_parser import FinanceParser
            lines = note.content.split('\n')
            new_lines = []
            deleted = False
            
            for line in lines:
                if not deleted:
                    parsed_list = FinanceParser.parse_note_content(line)
                    if parsed_list:
                        p = parsed_list[0]
                        # Check if it's the matching transaction
                        if (p["type"] == tx.type and 
                            p["amount_naira"] == tx.amount_naira and 
                            p["description"] == tx.description):
                            deleted = True
                            continue # skip this line
                new_lines.append(line)
                
            if deleted:
                note.content = '\n'.join(new_lines)
                db.commit()
                # Run sync_note_transactions to reverse wallet and delete from DB
                from services.finance_service import FinanceService
                FinanceService.sync_note_transactions(db, note.id, note.content)
                return {"message": "Transaction deleted successfully"}
                
    # Fallback if not linked to a note or not found in note
    db.delete(tx)
    db.commit()
    return {"message": "Transaction deleted"}

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

@router.put("/wallets/{wallet_id}")
def update_wallet(wallet_id: int, req: WalletUpdate, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    w = db.query(models.Wallet).filter(models.Wallet.id == wallet_id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Wallet not found")
    
    update_data = req.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(w, key, value)
        
    db.commit()
    db.refresh(w)
    return w

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

@router.get("/subscriptions", response_model=List[schemas.SubscriptionResponse])
def get_subscriptions(db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    return FinanceRepository.get_subscriptions(db)

@router.post("/subscriptions", response_model=schemas.SubscriptionResponse)
def create_subscription(req: schemas.SubscriptionBase, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    return FinanceRepository.create_subscription(db, req.dict())

@router.delete("/subscriptions/{sub_id}")
def delete_subscription(sub_id: int, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    FinanceRepository.delete_subscription(db, sub_id)
    return {"message": "Subscription deleted"}

@router.post("/subscriptions/{sub_id}/pay", response_model=schemas.SubscriptionResponse)
def pay_subscription(sub_id: int, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    sub = FinanceRepository.get_subscription_by_id(db, sub_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    from datetime import timedelta
    # Advance the due date
    if sub.cycle.lower() == 'weekly':
        sub.next_due_date = sub.next_due_date + timedelta(days=7)
    elif sub.cycle.lower() == 'yearly':
        sub.next_due_date = sub.next_due_date.replace(year=sub.next_due_date.year + 1)
    else: # default monthly
        # simple advance month
        month = sub.next_due_date.month
        year = sub.next_due_date.year
        if month == 12:
            month = 1
            year += 1
        else:
            month += 1
        # handled simply without calendar edge cases for now, or just use timedelta(days=30)
        sub.next_due_date = sub.next_due_date + timedelta(days=30)

    return FinanceRepository.update_subscription(db, sub)
