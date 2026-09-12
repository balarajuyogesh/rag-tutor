import logging

import uvicorn
from fastapi import FastAPI

from rag_tutor.core import lifespan
from rag_tutor.core.vectordb.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Notes API",
    description="A simple Notes REST API built with FastAPI and SQLAlchemy",
    version="1.0.0",
    lifespan=lifespan,
)
app.state.port = settings.TUTOR_SERVER_PORT
logger.info("Rag Tutor API configured for port %s", settings.TUTOR_SERVER_PORT)


@app.get("/", tags=["Root"])
def root():
    """
    Health check endpoint.
    """
    return {
        "message": "Welcome to Notes API 🚀",
        "docs": "/docs",
        "redoc": "/redoc",
    }


@app.get("/health", tags=["Health"])
def health():
    """
    Health check endpoint.
    """
    return {
        "status": "healthy",
    }


if __name__ == "__main__":
    uvicorn.run(
        "rag_tutor.main:app",
        host="127.0.0.1",
        port=settings.TUTOR_SERVER_PORT,
        reload=True,
    )
