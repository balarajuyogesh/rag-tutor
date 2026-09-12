from contextlib import asynccontextmanager

from fastapi import FastAPI

import rag_tutor.models  # noqa: F401
from rag_tutor.core.vectordb.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize the SurrealDB connection for the app lifecycle."""
    app.state.db = await init_db()
    try:
        yield
    finally:
        await app.state.db.close()
