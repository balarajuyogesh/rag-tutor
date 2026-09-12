from pathlib import Path

import pytest

from rag_tutor.rag.store import chunk_pdf


def test_chunk_pdf_rejects_invalid_overlap() -> None:
    with pytest.raises(ValueError, match="overlap"):
        chunk_pdf(Path("unused.pdf"), chunk_size=100, overlap=100)


def test_vector_calculus_pdf_is_chunked_with_page_metadata() -> None:
    path = next(Path("kb/doc").glob("*Vector*Calculus*.pdf"))
    chunks = chunk_pdf(path)

    assert chunks
    assert chunks[0].page >= 1
    assert chunks[0].source == path.as_posix()
    assert all(chunk.content for chunk in chunks)
