from functools import lru_cache

from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

load_dotenv(".env.local")
load_dotenv()


class Settings(BaseSettings):
    DATABASE_URL: str = "ws://localhost:8000/rpc"
    SURREALDB_NS: str = "rag_tutor"
    SURREALDB_DB: str = "rag_tutor"
    SURREALDB_USER: str = "root"
    SURREALDB_PASS: str = "root"
    TUTOR_SERVER_PORT: int = 8005
    OPENAI_API_KEY: str = ""
    OPENAI_CHAT_MODEL: str = "gpt-5.4-mini"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"
    EMBEDDING_DIMENSIONS: int = 1536
    RAG_TOP_K: int = 5
    KB_PATH: str = "kb/doc"
    MAX_PDF_SIZE_MB: int = 250

    model_config = SettingsConfigDict(
        env_file=(".env", ".env.local"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
