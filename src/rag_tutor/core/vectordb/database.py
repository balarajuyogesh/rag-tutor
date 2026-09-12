from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import Depends
from surrealdb import AsyncSurreal

from rag_tutor.core.vectordb.config import settings


async def init_db() -> AsyncSurreal:
    """Initialize and authenticate a SurrealDB connection for the app."""
    client = AsyncSurreal(settings.DATABASE_URL)
    await client.signin(
        {
            "user": settings.SURREALDB_USER,
            "pass": settings.SURREALDB_PASS,
        }
    )
    await client.use(settings.SURREALDB_NS, settings.SURREALDB_DB)
    return client


async def get_db() -> AsyncGenerator[AsyncSurreal]:
    """FastAPI dependency that provides one SurrealDB client per request."""
    db = await init_db()
    try:
        yield db
    finally:
        await db.close()


DbSession = Depends(get_db)
Database = Annotated[AsyncSurreal, Depends(get_db)]

