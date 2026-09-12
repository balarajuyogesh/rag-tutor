from functools import lru_cache

from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

load_dotenv()


class Settings(BaseSettings):
    DATABASE_URL: str = "ws://localhost:8000/rpc"
    SURREALDB_NS: str = "rag_tutor"
    SURREALDB_DB: str = "rag_tutor"
    SURREALDB_USER: str = "root"
    SURREALDB_PASS: str = "root"
    TUTOR_SERVER_PORT: int = 8005

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
