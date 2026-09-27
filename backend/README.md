# NEKO AI — Backend (FastAPI)

Production REST API for NEKO AI: JWT auth, PostgreSQL persistence via SQLAlchemy,
and an environment-configured LLM adapter (keys never reach the browser).

## Run locally

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in DATABASE_URL + JWT_SECRET (+ optional LLM_* vars)
uvicorn app.main:app --reload
```

OpenAPI docs: http://localhost:8000/docs

## Deploy (Render / Railway)

- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Set env vars from `.env.example`. Point the frontend's *Settings → AI engine → Remote backend* field at the deployed URL.
