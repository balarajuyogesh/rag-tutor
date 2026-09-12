from __future__ import annotations

from pathlib import Path

from surrealdb import Surreal

from .config import settings


class MigrationRunner:
    def __init__(self) -> None:
        self.root = Path(__file__).resolve().parent
        self.migration_dir = self.root / "migrations"

    def _connect(self) -> Surreal:
        client = Surreal(settings.DATABASE_URL)
        client.signin({
            "user": settings.SURREALDB_USER,
            "pass": settings.SURREALDB_PASS,
        })
        return client

    async def bootstrap(self) -> None:
        client = self._connect()
        try:
            client.use(settings.SURREALDB_NS, settings.SURREALDB_DB)
            print(
                "Connected to namespace="
                f"{settings.SURREALDB_NS} and database={settings.SURREALDB_DB}"
            )
        finally:
            client.close()

    async def apply_all(self) -> None:
        if not self.migration_dir.exists():
            print(f"No migration directory found at {self.migration_dir}")
            return

        client = self._connect()
        try:
            client.use(settings.SURREALDB_NS, settings.SURREALDB_DB)
            for path in sorted(self.migration_dir.glob("*.surql")):
                sql = path.read_text(encoding="utf-8")
                print(f"Applying migration: {path.name}")
                client.query(sql)
        finally:
            client.close()

    async def status(self) -> None:
        if not self.migration_dir.exists():
            print(f"No migration directory found at {self.migration_dir}")
            return

        files = sorted(self.migration_dir.glob("*.surql"))
        print(f"Found {len(files)} migration files:")
        for path in files:
            print(f"- {path.name}")
