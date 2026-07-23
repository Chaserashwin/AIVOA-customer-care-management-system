from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "AIVOA Complaint Copilot API"
    api_v1_prefix: str = "/api/v1"
    database_url: str = "sqlite:///./aivoa_demo.db"
    groq_api_key: str | None = None
    groq_small_model: str = "gemma2-9b-it"
    groq_reasoning_model: str = "llama-3.3-70b-versatile"
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ]
    upload_dir: str = "var/uploads"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
