from __future__ import annotations

import hashlib
from dataclasses import dataclass
from pathlib import Path

from openai import AsyncOpenAI
from pypdf import PdfReader
from surrealdb import AsyncSurreal, RecordID

from rag_tutor.core.vectordb.config import settings


@dataclass(frozen=True)
class TextChunk:
    document_id: str
    source: str
    title: str
    page: int
    chunk_index: int
    content: str

    @property
    def content_hash(self) -> str:
        return hashlib.sha256(self.content.encode()).hexdigest()

    @property
    def record_id(self) -> str:
        value = f"{self.document_id}:{self.page}:{self.chunk_index}"
        return hashlib.sha256(value.encode()).hexdigest()[:32]


@dataclass(frozen=True)
class IngestedDocument:
    document_id: str
    source: str
    title: str
    page_count: int
    chunks_stored: int
    size_bytes: int
    content_hash: str


class PdfHasNoTextError(ValueError):
    """Raised when a PDF contains no text that can be indexed."""


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as file:
        for block in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def safe_source_name(name: str) -> str:
    """Return only the filename portion of an untrusted upload name."""
    return name.replace("\\", "/").rsplit("/", 1)[-1].strip() or "document.pdf"


def chunk_pdf(
    path: Path,
    chunk_size: int = 1_500,
    overlap: int = 200,
    *,
    source_name: str | None = None,
    document_id: str | None = None,
) -> list[TextChunk]:
    """Extract a PDF page-by-page and split it into overlapping text chunks."""
    if overlap >= chunk_size:
        raise ValueError("overlap must be smaller than chunk_size")

    source = safe_source_name(source_name) if source_name else path.as_posix()
    resolved_document_id = document_id or file_sha256(path)[:32]
    reader = PdfReader(path)
    chunks: list[TextChunk] = []
    chunk_index = 0
    for page_number, page in enumerate(reader.pages, start=1):
        text = " ".join((page.extract_text() or "").split())
        start = 0
        while start < len(text):
            end = min(start + chunk_size, len(text))
            if end < len(text):
                boundary = text.rfind(" ", start, end)
                if boundary > start:
                    end = boundary
            content = text[start:end].strip()
            if content:
                chunks.append(
                    TextChunk(
                        document_id=resolved_document_id,
                        source=source,
                        title=Path(source).stem.replace("_", " ").strip(),
                        page=page_number,
                        chunk_index=chunk_index,
                        content=content,
                    )
                )
                chunk_index += 1
            if end >= len(text):
                break
            start = max(end - overlap, start + 1)
    return chunks


async def embed_texts(texts: list[str], client: AsyncOpenAI) -> list[list[float]]:
    response = await client.embeddings.create(
        model=settings.OPENAI_EMBEDDING_MODEL,
        input=texts,
        dimensions=settings.EMBEDDING_DIMENSIONS,
    )
    return [item.embedding for item in response.data]


async def ingest_pdf(
    path: Path,
    db: AsyncSurreal,
    client: AsyncOpenAI,
    *,
    source_name: str | None = None,
) -> IngestedDocument:
    source = safe_source_name(source_name or path.as_posix())
    content_hash = file_sha256(path)
    document_id = content_hash[:32]
    reader = PdfReader(path)
    page_count = len(reader.pages)
    title = Path(source).stem.replace("_", " ").strip()
    chunks = chunk_pdf(path, source_name=source, document_id=document_id)
    if not chunks:
        raise PdfHasNoTextError("The PDF contains no extractable text")

    document_record = RecordID("document", document_id)
    await db.upsert(
        document_record,
        {
            "source": source,
            "title": title,
            "content_hash": content_hash,
            "page_count": page_count,
            "chunks_stored": len(chunks),
            "size_bytes": path.stat().st_size,
        },
    )

    for offset in range(0, len(chunks), 64):
        batch = chunks[offset : offset + 64]
        vectors = await embed_texts([chunk.content for chunk in batch], client)
        for chunk, vector in zip(batch, vectors, strict=True):
            await db.upsert(
                RecordID("knowledge_chunk", chunk.record_id),
                {
                    "document": document_record,
                    "source": chunk.source,
                    "title": chunk.title,
                    "page": chunk.page,
                    "chunk_index": chunk.chunk_index,
                    "content": chunk.content,
                    "content_hash": chunk.content_hash,
                    "embedding_model": settings.OPENAI_EMBEDDING_MODEL,
                    "embedding": vector,
                },
            )
    return IngestedDocument(
        document_id=document_id,
        source=source,
        title=title,
        page_count=page_count,
        chunks_stored=len(chunks),
        size_bytes=path.stat().st_size,
        content_hash=content_hash,
    )


async def search_chunks(
    question: str,
    db: AsyncSurreal,
    client: AsyncOpenAI,
    limit: int | None = None,
    document_ids: list[str] | None = None,
) -> list[dict]:
    top_k = max(1, min(limit or settings.RAG_TOP_K, 20))
    query_vector = (await embed_texts([question], client))[0]
    document_filter = ""
    variables: dict[str, object] = {"embedding": query_vector}
    if document_ids:
        document_filter = "AND document IN $documents"
        variables["documents"] = [RecordID("document", value) for value in document_ids]

    query = f"""
        SELECT document.id() AS document_id, source, title, page,
               chunk_index, content,
               vector::distance::knn() AS distance
        FROM knowledge_chunk
        WHERE embedding <|{top_k},100|> $embedding
        {document_filter};
    """
    result = await db.query(query, variables)
    return result if isinstance(result, list) else []


async def list_documents(db: AsyncSurreal) -> list[dict]:
    result = await db.query(
        """
        SELECT id.id() AS document_id, source, title, page_count, chunks_stored,
               size_bytes, created_at, updated_at
        FROM document
        ORDER BY created_at DESC;
        """
    )
    return result if isinstance(result, list) else []
