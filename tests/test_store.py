from pathlib import Path

import pytest

from rag_tutor.rag.store import chunk_pdf, safe_source_name


def test_chunk_pdf_rejects_invalid_overlap() -> None:
    with pytest.raises(ValueError, match="overlap"):
        chunk_pdf(Path("unused.pdf"), chunk_size=100, overlap=100)


def test_vector_calculus_pdf_is_chunked_with_page_metadata() -> None:
    path = next(Path("kb/doc").glob("*Vector*Calculus*.pdf"))
    chunks = chunk_pdf(path)

    assert chunks
    assert chunks[0].page >= 1
    assert chunks[0].source == path.as_posix()
    assert len(chunks[0].document_id) == 32
    assert all(chunk.content for chunk in chunks)


def test_uploaded_pdf_uses_safe_source_name_and_stable_document_id() -> None:
    path = next(Path("kb/doc").glob("*Vector*Calculus*.pdf"))
    first = chunk_pdf(path, source_name="../../uploaded/book.pdf")
    second = chunk_pdf(path, source_name="book.pdf")

    assert first[0].source == "book.pdf"
    assert first[0].document_id == second[0].document_id
    assert safe_source_name(r"C:\fakepath\lesson.pdf") == "lesson.pdf"
