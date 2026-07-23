from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import chat, complaints, health, uploads
from app.core.config import get_settings
from app.db.session import init_db


settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="AI-powered customer complaint management system for pharma QMS workflows.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix=settings.api_v1_prefix, tags=["health"])
app.include_router(chat.router, prefix=settings.api_v1_prefix, tags=["ai"])
app.include_router(uploads.router, prefix=settings.api_v1_prefix, tags=["uploads"])
app.include_router(complaints.router, prefix=settings.api_v1_prefix, tags=["complaints"])


@app.on_event("startup")
def on_startup() -> None:
    init_db()

