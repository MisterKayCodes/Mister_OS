# Rule: Max 200 lines per file — split if exceeded
# MOUTH: FastAPI Dependencies (Auth)

from fastapi import Depends, HTTPException, Security
from fastapi.security.api_key import APIKeyHeader
from starlette.status import HTTP_403_FORBIDDEN
import os

from data import database, models
from sqlalchemy.orm import Session
from datetime import datetime

# The Master Token is now only used during /login, but we still define the header name here
API_KEY_NAME = "X-Master-Token"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

async def get_master_token(
    api_key_header: str = Security(api_key_header),
    db: Session = Depends(database.get_db)
):
    if not api_key_header:
        raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail="Missing Master Token")
    
    session = db.query(models.AuthSession).filter(models.AuthSession.token == api_key_header).first()
    if session:
        # Update last_active silently
        session.last_active = datetime.utcnow()
        db.commit()
        return session.token
        
    raise HTTPException(
        status_code=HTTP_403_FORBIDDEN, detail="Invalid Master Token"
    )
