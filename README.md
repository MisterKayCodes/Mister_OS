# Mister OS

Mister OS is a comprehensive, full-stack personal operating system designed to manage notes, finances, leads, and automated Telegram outreach. It features a modern, responsive React frontend powered by Vite, a robust FastAPI Python backend, and a suite of dedicated Python microservices for Telegram automation.

## 🚀 Features

- **Personal Knowledge Management (Notes):** 
  - Hierarchical folder organization.
  - Markdown-based note editor.
  - Quick omni-chat to interact with your notes and logs via AI.
- **Financial Tracking (Finance):**
  - Manage multiple wallets, deposits, and transactions.
  - Track financial goals and debts.
  - AI-powered affordability checks ("Can I afford this?") and finance insights.
- **CRM & Leads Management (Leads):**
  - Track leads and interactions.
  - View AI-summarized transcripts of chats.
  - Draft AI-generated responses for pending interactions.
- **Automated Outreach (Hunts & Telegram Service):**
  - Scrape channels and admins from Telegram.
  - Generate high-converting outreach templates using AI based on past successful chats.
  - Run automated background outreach workers with customizable delays.
  - Boss Alert System: Automatically forwards hot leads and buy signals to a specified Telegram username.

## 🏗️ Architecture

The project is split into three main components:

1. **`frontend/`** (Vite + React + TailwindCSS)
   - A fast, modern web application.
   - Communicates with the backend APIs via environment-configured base URLs.
2. **`backend/`** (FastAPI + SQLAlchemy + Alembic + ChromaDB)
   - The central API serving the frontend.
   - Uses an SQLite database (`mister_os.db`) managed via Alembic migrations.
   - Integrates ChromaDB for AI vector search capabilities on notes and transcripts.
3. **`telegram_service/`** (Python + Telethon)
   - Independent background workers (`hunt_worker.py`, `outreach_worker.py`, `auto_sort.py`).
   - Hooks into the Telegram API to automate scraping, messaging, and syncing data back to the main backend.

## 🛠️ Setup & Local Development

### 1. Backend Setup
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run database migrations (if needed):
   ```bash
   alembic upgrade head
   ```
5. Start the FastAPI server (runs on port 8011 by default):
   ```bash
   uvicorn main:app --reload --port 8011
   ```

### 2. Frontend Setup
1. Navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

### 3. Telegram Services
The Telegram microservices require their own environment setup. 
Ensure you provide your Telegram `API_ID` and `API_HASH` in a `.env` file within the `telegram_service` directory, along with the `MAIN_BACKEND_URL` (default is `http://localhost:8011`).

Run individual workers as needed, for example:
```bash
cd telegram_service
python main.py
```

## 🌍 Deployment

### Environment Variables
Before building for production, ensure the appropriate environment variables are set.

**Frontend:**
- `VITE_API_BASE_URL` - The public URL of your FastAPI backend (e.g., `https://api.misteros.com`).
- `VITE_MICROSERVICE_BASE_URL` - The public URL of your Telegram outreach service (if exposed via API).

**Backend / Telegram Services:**
- `MAIN_BACKEND_URL` - Used by the telegram services to ping the main DB.
- `DATABASE_URL` (if migrating away from local SQLite).

### Building the Frontend
To compile the frontend for production deployment:
```bash
cd frontend
npm run build
```
This generates a `dist/` directory ready to be hosted on platforms like Vercel, Netlify, or any static file server.

## 🤝 Contributing
- Follow the established pattern of keeping React components under ~200 lines (use the "Barrel File" `index.js` pattern for splitting logic).
- Ensure new backend models have corresponding Alembic migrations.
