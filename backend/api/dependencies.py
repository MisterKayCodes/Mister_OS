# Rule: Max 200 lines per file — split if exceeded
# MOUTH: FastAPI Dependencies (Auth)

from fastapi import Depends, HTTPException, Security
from fastapi.security.api_key import APIKeyHeader
from starlette.status import HTTP_403_FORBIDDEN
import os

# The Master Token for Zero-Friction Auth
MASTER_TOKEN = os.getenv("MASTER_TOKEN", "mister_os_secret_token_123")
API_KEY_NAME = "X-Master-Token"

api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

async def get_master_token(api_key_header: str = Security(api_key_header)):
    if api_key_header == MASTER_TOKEN:
        return api_key_header
    raise HTTPException(
        status_code=HTTP_403_FORBIDDEN, detail="Could not validate Master Token"
    )
