"""Application configuration and settings loader."""

from functools import lru_cache
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    environment: str = Field(default="development", env="ENVIRONMENT")

    postgres_host: str = Field(default="localhost", env="POSTGRES_HOST")
    postgres_port: int = Field(default=5432, env="POSTGRES_PORT")
    postgres_user: str = Field(default="aether", env="POSTGRES_USER")
    postgres_password: str = Field(default="changeme", env="POSTGRES_PASSWORD")
    postgres_db: str = Field(default="aetherdb", env="POSTGRES_DB")

    redis_host: str = Field(default="localhost", env="REDIS_HOST")
    redis_port: int = Field(default=6379, env="REDIS_PORT")

    minio_endpoint: str = Field(default="localhost:9000", env="MINIO_ENDPOINT")
    minio_access_key: str = Field(default="changeme", env="MINIO_ACCESS_KEY")
    minio_secret_key: str = Field(default="changeme", env="MINIO_SECRET_KEY")
    minio_use_ssl: bool = Field(default=False, env="MINIO_USE_SSL")
    minio_bucket: str = Field(default="aether-artifacts", env="MINIO_BUCKET")

    api_host: str = Field(default="0.0.0.0", env="AETHERFRAME_API_HOST")
    api_port: int = Field(default=8000, env="AETHERFRAME_API_PORT")

    worker_concurrency: int = Field(default=2, env="AETHERFRAME_WORKER_CONCURRENCY")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Cached settings loader."""
    return Settings()
