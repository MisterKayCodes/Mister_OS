# Single source of truth — re-export from database so all models share one Base
from data.database import Base

__all__ = ["Base"]