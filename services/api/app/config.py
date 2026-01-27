"""
FastAPI Backend Configuration

Loads settings from environment variables with sensible defaults.
"""

from functools import lru_cache
from pathlib import Path
from typing import Literal

from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

REPO_ROOT = Path(__file__).resolve().parents[3]
SERVICE_ROOT = Path(__file__).resolve().parents[1]

for _env_file in (
    REPO_ROOT / ".env.test",
    REPO_ROOT / ".env.local",
    REPO_ROOT / ".env",
    SERVICE_ROOT / ".env",
):
    if _env_file.exists():
        load_dotenv(_env_file, override=False)


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        case_sensitive=False,
        extra="ignore",
    )

    # Database
    database_url: str

    @property
    def async_database_url(self) -> str:
        """Ensure URL uses asyncpg driver."""
        url = self.database_url
        if url.startswith("postgresql://") and "+asyncpg" not in url:
            return url.replace("postgresql://", "postgresql+asyncpg://")
        return url

    # Redis (for rate limiting, caching, and Celery)
    redis_url: str = "redis://localhost:6379/0"

    # JWT Configuration
    jwt_secret: str
    jwt_issuer: str = "lms-auth"
    jwt_audience: str = "lms-api"
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 60
    refresh_token_days: int = 7

    # Environment
    env: Literal["development", "production", "test"] = "development"
    debug: bool = False

    # Cookie settings
    cookie_secure: bool = False  # Set True in production
    cookie_samesite: Literal["lax", "strict", "none"] = "lax"
    cookie_httponly: bool = True

    # E2E/Test toggles
    skip_db_auth: bool = False

    @property
    def is_production(self) -> bool:
        return self.env == "production"

    @property
    def access_token_expire_seconds(self) -> int:
        return self.access_token_minutes * 60

    @property
    def refresh_token_expire_seconds(self) -> int:
        return self.refresh_token_days * 24 * 60 * 60


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()  # type: ignore
