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
        value = f"{self.source}:{self.page}:{self.chunk_index}"
        return hashlib.sha256(value.encode()).hexdigest()[:32]


def chunk_pdf(
    path: Path, chunk_size: int = 1_500, overlap: int = 200
) -> list[TextChunk]:
    """Extract a PDF page-by-page and split it into overlapping text chunks."""
    if overlap >= chunk_size:
        raise ValueError("overlap must be smaller than chunk_size")

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
                        source=path.as_posix(),
                        title=path.stem.replace("_", " ").strip(),
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


async def ingest_pdf(path: Path, db: AsyncSurreal, client: AsyncOpenAI) -> int:
    chunks = chunk_pdf(path)
    for offset in range(0, len(chunks), 64):
        batch = chunks[offset : offset + 64]
        vectors = await embed_texts([chunk.content for chunk in batch], client)
        for chunk, vector in zip(batch, vectors, strict=True):
            await db.upsert(
                RecordID("knowledge_chunk", chunk.record_id),
                {
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
    return len(chunks)


async def search_chunks(
    question: str, db: AsyncSurreal, client: AsyncOpenAI, limit: int | None = None
) -> list[dict]:
    top_k = max(1, min(limit or settings.RAG_TOP_K, 20))
    query_vector = (await embed_texts([question], client))[0]
    query = f"""
        SELECT source, title, page, chunk_index, content,
               vector::distance::knn() AS distance
        FROM knowledge_chunk
        WHERE embedding <|{top_k},100|> $embedding;
    """
    result = await db.query(query, {"embedding": query_vector})
    return result if isinstance(result, list) else []
