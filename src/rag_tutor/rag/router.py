from __future__ import annotations

import tempfile
from datetime import datetime
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, File, HTTPException, UploadFile, status
from openai import AsyncOpenAI
from pydantic import BaseModel, Field
from pypdf.errors import PdfReadError

from rag_tutor.core.vectordb import Database, settings
from rag_tutor.rag.agent import answer_question
from rag_tutor.rag.store import (
    PdfHasNoTextError,
    ingest_pdf,
    list_documents,
    safe_source_name,
)

router = APIRouter(prefix="/rag", tags=["RAG"])
PdfUpload = Annotated[UploadFile, File(description="PDF book to ingest")]
DocumentId = Annotated[str, Field(pattern=r"^[0-9a-f]{32}$")]


class AskRequest(BaseModel):
    question: str = Field(min_length=1, max_length=4_000)
    document_ids: list[DocumentId] | None = Field(default=None, max_length=20)


class AskResponse(BaseModel):
    answer: str


class IngestResponse(BaseModel):
    document_id: str
    source: str
    title: str
    page_count: int
    chunks_stored: int
    size_bytes: int


class DocumentResponse(BaseModel):
    document_id: str
    source: str
    title: str
    page_count: int
    chunks_stored: int
    size_bytes: int
    created_at: datetime
    updated_at: datetime


@router.post("/ask", response_model=AskResponse)
async def ask(request: AskRequest, db: Database) -> AskResponse:
    if not settings.OPENAI_API_KEY:
        raise HTTPException(status_code=503, detail="OPENAI_API_KEY is not configured")
    return AskResponse(
        answer=await answer_question(request.question, db, request.document_ids)
    )


@router.get("/documents", response_model=list[DocumentResponse])
async def documents(db: Database) -> list[DocumentResponse]:
    records = await list_documents(db)
    return [DocumentResponse.model_validate(record) for record in records]


@router.post(
    "/ingest",
    response_model=IngestResponse,
    status_code=status.HTTP_201_CREATED,
)
async def ingest(db: Database, file: PdfUpload) -> IngestResponse:
    if not settings.OPENAI_API_KEY:
        raise HTTPException(status_code=503, detail="OPENAI_API_KEY is not configured")

    source = safe_source_name(file.filename or "document.pdf")
    if not source.lower().endswith(".pdf"):
        raise HTTPException(status_code=415, detail="Only PDF files are supported")

    max_bytes = settings.MAX_PDF_SIZE_MB * 1024 * 1024
    total_bytes = 0
    temp_path: Path | None = None
    try:
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as temporary:
            temp_path = Path(temporary.name)
            while chunk := await file.read(1024 * 1024):
                total_bytes += len(chunk)
                if total_bytes > max_bytes:
                    raise HTTPException(
                        status_code=413,
                        detail=f"PDF exceeds the {settings.MAX_PDF_SIZE_MB} MB limit",
                    )
                temporary.write(chunk)

        if total_bytes == 0:
            raise HTTPException(status_code=422, detail="The uploaded PDF is empty")
        with temp_path.open("rb") as uploaded_pdf:
            if uploaded_pdf.read(5) != b"%PDF-":
                raise HTTPException(
                    status_code=415, detail="The uploaded file is not a PDF"
                )

        document = await ingest_pdf(
            temp_path,
            db,
            AsyncOpenAI(api_key=settings.OPENAI_API_KEY),
            source_name=source,
        )
        return IngestResponse(
            document_id=document.document_id,
            source=document.source,
            title=document.title,
            page_count=document.page_count,
            chunks_stored=document.chunks_stored,
            size_bytes=document.size_bytes,
        )
    except PdfReadError as error:
        raise HTTPException(
            status_code=422, detail="The PDF could not be read"
        ) from error
    except PdfHasNoTextError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    finally:
        await file.close()
        if temp_path is not None:
            temp_path.unlink(missing_ok=True)
