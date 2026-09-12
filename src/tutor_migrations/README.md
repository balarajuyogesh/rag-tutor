# tutor-migrations

Standalone SurrealDB migration project for the rag-tutor application.

## Overview

This package manages database bootstrap and migration scripts separately from the FastAPI service so schema changes can be versioned and applied in isolation.

## Usage

From the repository root:

```bash
uv run --project src/tutor_migrations tutor-migrations --help
uv run --project src/tutor_migrations tutor-migrations bootstrap
uv run --project src/tutor_migrations tutor-migrations apply
uv run --project src/tutor_migrations tutor-migrations status
```

## Configuration

Create a local `.env` file in the repository root or inside this project with values such as:

```dotenv
DATABASE_URL=ws://localhost:8001/rpc
SURREALDB_NS=rag_tutor
SURREALDB_DB=rag_tutor
SURREALDB_USER=root
SURREALDB_PASS=root
```

## Directory layout

- `src/tutor_migrations/migrations/` contains ordered SQL migration scripts.
- `src/tutor_migrations/runner.py` handles connection and migration execution.
- `src/tutor_migrations/cli.py` exposes the command-line interface.
