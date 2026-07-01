# Rule: Max 200 lines per file — split if exceeded
# SKELETON: FastAPI Application Startup

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from data import database, models
from api.routes import notes

# Create the SQLite tables
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Mister OS API")

# Allow Vercel frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # TODO: Restrict to your Vercel subdomain in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(notes.router)

@app.get("/")
def health_check():
    return {"status": "Mister OS Backend is Running", "version": "0.1.0"}
