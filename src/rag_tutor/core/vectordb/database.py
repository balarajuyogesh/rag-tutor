from collections.abc import AsyncGenerator

from fastapi import Depends
from surrealdb import Surreal

from rag_tutor.core.vectordb.config import settings


async def init_db() -> Surreal:
    """Initialize and authenticate a SurrealDB connection for the app."""
    client = Surreal(settings.DATABASE_URL)
    client.signin({
        "user": settings.SURREALDB_USER,
        "pass": settings.SURREALDB_PASS,
    })
    client.use(settings.SURREALDB_NS, settings.SURREALDB_DB)
    return client


async def get_db() -> AsyncGenerator[Surreal]:
    """FastAPI dependency that provides one SurrealDB client per request."""
    db = await init_db()
    try:
        yield db
    finally:
        db.close()


DbSession = Depends(get_db)
