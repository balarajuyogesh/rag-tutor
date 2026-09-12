from __future__ import annotations

import asyncio
from pathlib import Path

from openai import AsyncOpenAI

from rag_tutor.core.vectordb.config import settings
from rag_tutor.core.vectordb.database import init_db
from rag_tutor.rag.store import ingest_pdf


async def main() -> None:
    path = next(Path(settings.KB_PATH).glob("*Vector*Calculus*.pdf"), None)
    if path is None:
        raise FileNotFoundError(f"No Vector Calculus PDF found in {settings.KB_PATH}")
    db = await init_db()
    try:
        document = await ingest_pdf(
            path,
            db,
            AsyncOpenAI(api_key=settings.OPENAI_API_KEY),
            source_name=path.name,
        )
        print(f"Stored {document.chunks_stored} chunks from {path}")
    finally:
        await db.close()


if __name__ == "__main__":
    asyncio.run(main())
