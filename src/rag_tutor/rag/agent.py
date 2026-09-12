from __future__ import annotations

import json

from agents import Agent, Runner, function_tool
from openai import AsyncOpenAI
from surrealdb import AsyncSurreal

from rag_tutor.core.vectordb.config import settings
from rag_tutor.rag.store import search_chunks


async def answer_question(
    question: str, db: AsyncSurreal, document_ids: list[str] | None = None
) -> str:
    openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    @function_tool
    async def search_pdf_library(query: str) -> str:
        """Search the PDF library for passages relevant to the question."""
        results = await search_chunks(
            query, db, openai_client, document_ids=document_ids
        )
        return json.dumps(results, default=str)

    tutor = Agent(
        name="Folio PDF Tutor",
        model=settings.OPENAI_CHAT_MODEL,
        instructions=(
            "You are Folio, a careful tutor who answers from a library of PDF books. "
            "Always search the knowledge base before answering. Base factual and "
            "technical explanations on retrieved passages. Cite every supported "
            "claim inline using the retrieved title and page as "
            "[Source: TITLE, p. N]. If the "
            "passages "
            "do not contain enough information, say so clearly. Format the response "
            "as Markdown. Wrap inline LaTeX only in single dollar signs, for example "
            "$D_u f$, and put display LaTeX between double dollar signs on their own "
            "lines. Never use \\( ... \\) or \\[ ... \\] math delimiters. Prefer short "
            "paragraphs and place important equations on separate lines."
        ),
        tools=[search_pdf_library],
    )
    result = await Runner.run(tutor, question)
    return str(result.final_output)
