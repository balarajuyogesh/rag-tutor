from __future__ import annotations

import json

from agents import Agent, Runner, function_tool
from openai import AsyncOpenAI
from surrealdb import AsyncSurreal

from rag_tutor.core.vectordb.config import settings
from rag_tutor.rag.store import search_chunks


async def answer_question(question: str, db: AsyncSurreal) -> str:
    openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    @function_tool
    async def search_vector_calculus(query: str) -> str:
        """Search the Vector Calculus knowledge base for passages relevant to query."""
        results = await search_chunks(query, db, openai_client)
        return json.dumps(results, default=str)

    tutor = Agent(
        name="Vector Calculus Tutor",
        model=settings.OPENAI_CHAT_MODEL,
        instructions=(
            "You are a careful vector calculus tutor. Always search the knowledge base "
            "before answering. Base factual and mathematical explanations on retrieved "
            "passages. Cite supporting passages inline as [source, p. N]. If the "
            "passages "
            "do not contain enough information, say so clearly."
        ),
        tools=[search_vector_calculus],
    )
    result = await Runner.run(tutor, question)
    return str(result.final_output)
