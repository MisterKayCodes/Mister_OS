from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from data import models, schemas, database
from api.dependencies import get_master_token
from services.life_service import LifeService

router = APIRouter(prefix="/api/life", tags=["Life"])

@router.get("/progress", response_model=schemas.LifeUserProgressResponse)
def get_progress(db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    return LifeService.get_progress(db)

@router.get("/tasks/defs", response_model=List[schemas.LifeTaskDefResponse])
def get_task_defs(db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    return db.query(models.LifeTaskDef).order_by(models.LifeTaskDef.order_index).all()

@router.post("/tasks/defs", response_model=schemas.LifeTaskDefResponse)
def create_task_def(req: schemas.LifeTaskDefCreate, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    td = models.LifeTaskDef(**req.dict())
    db.add(td)
    db.commit()
    db.refresh(td)
    return td

@router.put("/tasks/defs/{def_id}", response_model=schemas.LifeTaskDefResponse)
def update_task_def(def_id: int, req: schemas.LifeTaskDefUpdate, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    td = db.query(models.LifeTaskDef).filter(models.LifeTaskDef.id == def_id).first()
    if not td:
        raise HTTPException(status_code=404, detail="Task def not found")
    
    update_data = req.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(td, key, value)
        
    db.commit()
    db.refresh(td)
    return td

@router.delete("/tasks/defs/{def_id}")
def delete_task_def(def_id: int, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    td = db.query(models.LifeTaskDef).filter(models.LifeTaskDef.id == def_id).first()
    if not td:
        raise HTTPException(status_code=404, detail="Task def not found")
    db.delete(td)
    db.commit()
    return {"message": "Deleted"}

@router.post("/tasks/session", response_model=schemas.LifeUserProgressResponse)
def log_task_session(req: schemas.LifeTaskSessionCreate, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    return LifeService.log_task_session(db, req)

# Added this so we can fetch history and show 'Done xN today' (we don't lock tasks, gym log style!)
@router.get("/tasks/sessions", response_model=List[schemas.LifeTaskSessionResponse])
def get_task_sessions(db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    # Fetch all sessions, newest first
    return db.query(models.LifeTaskSession).order_by(models.LifeTaskSession.date_logged.desc()).all()

@router.get("/rewards", response_model=List[schemas.LifeRewardResponse])
def get_rewards(db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    return db.query(models.LifeReward).order_by(models.LifeReward.order_index).all()

@router.post("/rewards", response_model=schemas.LifeRewardResponse)
def create_reward(req: schemas.LifeRewardCreate, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    r = models.LifeReward(**req.dict())
    db.add(r)
    db.commit()
    db.refresh(r)
    return r

@router.delete("/rewards/{reward_id}")
def delete_reward(reward_id: int, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    r = db.query(models.LifeReward).filter(models.LifeReward.id == reward_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Reward not found")
    db.delete(r)
    db.commit()
    return {"message": "Deleted"}

@router.post("/rewards/unlock", response_model=schemas.LifeUserProgressResponse)
def unlock_reward(req: schemas.LifeRewardUnlockCreate, db: Session = Depends(database.get_db), token: str = Depends(get_master_token)):
    try:
        return LifeService.unlock_reward(db, req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
