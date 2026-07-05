from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from data.database import get_db
from data.models.task import Task

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    status: str = "pending"

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None

class TaskResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

@router.post("/", response_model=TaskResponse)
def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    db_task = Task(
        title=task.title,
        description=task.description,
        status=task.status
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

@router.get("/", response_model=List[TaskResponse])
def get_tasks(db: Session = Depends(get_db)):
    return db.query(Task).all()

@router.put("/{task_id}", response_model=TaskResponse)
def update_task(task_id: str, task: TaskUpdate, db: Session = Depends(get_db)):
    db_task = db.query(Task).filter(Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_data = task.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_task, key, value)
        
    db.commit()
    db.refresh(db_task)
    return db_task

@router.delete("/{task_id}")
def delete_task(task_id: str, db: Session = Depends(get_db)):
    db_task = db.query(Task).filter(Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(db_task)
    db.commit()
    return {"message": "Task deleted successfully"}
