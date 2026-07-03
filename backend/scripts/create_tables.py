import sys
import os

# Add backend directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from data import models, database

print("Creating new database tables...")
models.Base.metadata.create_all(bind=database.engine)
print("Done!")
