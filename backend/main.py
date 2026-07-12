# Rule: Max 200 lines per file — split if exceeded
# SKELETON: FastAPI Application Startup

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from data import database, models
from api.routes import notes, ai, finance, auth, leads, hunts, outreach_engine, knowledge, tasks, life
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

# Create the SQLite tables — uses database.Base which all models register onto
database.Base.metadata.create_all(bind=database.engine)

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
app.include_router(ai.router)
app.include_router(finance.router)
app.include_router(auth.router)
app.include_router(leads.router)
app.include_router(hunts.router)
app.include_router(outreach_engine.router)
app.include_router(knowledge.router)
app.include_router(tasks.router)
app.include_router(life.router, prefix="/life")

@app.get("/")
def health_check():
    return {"status": "Mister OS Backend is Running", "version": "0.1.0"}
