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

## Web chat

The React client lives in `apps/web` and is managed from the root Yarn
workspace. It uses Material UI for the design system and renders Markdown and
LaTeX equations with KaTeX.

```bash
yarn install
yarn dev
```

The development server runs at `http://127.0.0.1:5173` and proxies `/api` to
the FastAPI server at `http://127.0.0.1:8005`. Start the API separately with
`make dev`.

For a production build, set `VITE_API_BASE_URL` to the public FastAPI origin
and run:

```bash
yarn build
yarn preview
```

Other workspace commands are `yarn lint` and
`yarn workspace @rag-tutor/web <command>`.

## Local debugging

```

# Kill port with Nushell in ubuntu
let pids = (lsof -ti :8005 | lines)
if ($pids | is-not-empty) {
  $pids | each { |pid| kill -s 9 ($pid | into int) }
}
```
