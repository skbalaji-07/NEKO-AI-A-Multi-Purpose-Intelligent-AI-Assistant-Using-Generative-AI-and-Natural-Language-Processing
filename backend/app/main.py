from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .database import Base, engine
from .routers import auth, chat, memory, notes, tasks

settings = get_settings()

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="NEKO AI API",
    description="REST backend for NEKO AI — Neural Engine for Knowledge & Organisation.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(notes.router)
app.include_router(tasks.router)
app.include_router(memory.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "neko-ai-api"}
