import os
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    database_url: str = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://caloscan:caloscan_secure_pass@caloscan_postgres:5432/caloscan"
)

    # JWT
    secret_key: str = os.getenv("SECRET_KEY", "change-me-in-production")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days

    # AI
    minimax_api_key: str = os.getenv("MINIMAX_API_KEY", "")

    # Upload
    upload_dir: str = "/app/uploads"
    max_image_size: int = 300 * 1024  # 300KB
    max_image_dimension: int = 1200
    image_quality: float = 0.85

    class Config:
        env_file = ".env"
        extra = "allow"


@lru_cache
def get_settings() -> Settings:
    return Settings()