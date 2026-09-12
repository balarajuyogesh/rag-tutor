from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from openai import AsyncOpenAI
from pydantic import BaseModel, Field

from rag_tutor.core.vectordb import settings, Database
from rag_tutor.rag.agent import answer_question
from rag_tutor.rag.store import ingest_pdf

router = APIRouter(prefix="/rag", tags=["RAG"])


class AskRequest(BaseModel):
    question: str = Field(min_length=1, max_length=4_000)


class AskResponse(BaseModel):
    answer: str


class IngestResponse(BaseModel):
    source: str
    chunks_stored: int


@router.post("/ask", response_model=AskResponse)
async def ask(request: AskRequest, db: Database) -> AskResponse:
    if not settings.OPENAI_API_KEY:
        raise HTTPException(status_code=503, detail="OPENAI_API_KEY is not configured")
    return AskResponse(answer=await answer_question(request.question, db))


@router.post("/ingest", response_model=IngestResponse)
async def ingest(db: Database) -> IngestResponse:
    if not settings.OPENAI_API_KEY:
        raise HTTPException(status_code=503, detail="OPENAI_API_KEY is not configured")
    path = next(Path(settings.KB_PATH).glob("*Manelli*Algorithms*.pdf"), None)
    if path is None:
        raise HTTPException(status_code=404, detail="Vector Calculus PDF not found")
    count = await ingest_pdf(path, db, AsyncOpenAI(api_key=settings.OPENAI_API_KEY))
    return IngestResponse(source=path.as_posix(), chunks_stored=count)
