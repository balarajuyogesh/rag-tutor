# RAG Tutor

An OpenAI Agents SDK tutor that retrieves Vector Calculus passages from a
SurrealDB HNSW vector index.

## Setup and run

```bash
docker compose up -d surrealdb
uv sync
uv run poe migrate
uv run poe ingest
uv run poe dev
```

Ask a question:

```bash
curl -X POST http://127.0.0.1:8005/rag/ask \
  -H 'content-type: application/json' \
  -d '{"question":"What is the divergence theorem?"}'
```

Re-ingest `kb/doc/Vector_Calculus_ Formulations_Applications_Python_Codes.pdf`
at any time with `POST /rag/ingest`. Stable chunk IDs make ingestion idempotent.

## Local debugging

```

# Kill port with Nushell in ubuntu
let pids = (lsof -ti :8005 | lines)
if ($pids | is-not-empty) {
  $pids | each { |pid| kill -s 9 ($pid | into int) }
}
```
