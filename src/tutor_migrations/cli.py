from __future__ import annotations

import argparse
import asyncio

from .runner import MigrationRunner


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Manage SurrealDB migrations.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    bootstrap = subparsers.add_parser(
        "bootstrap",
        help="Ensure namespace/database exist",
    )
    bootstrap.set_defaults(handler="bootstrap")

    apply_parser = subparsers.add_parser("apply", help="Apply all migration files")
    apply_parser.set_defaults(handler="apply")

    status_parser = subparsers.add_parser(
        "status",
        help="List migration files and their status",
    )
    status_parser.set_defaults(handler="status")

    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    async def run() -> None:
        runner = MigrationRunner()
        if args.handler == "bootstrap":
            await runner.bootstrap()
            return
        if args.handler == "apply":
            await runner.apply_all()
            return
        if args.handler == "status":
            await runner.status()
            return
        raise ValueError(f"Unsupported command: {args.handler}")

    asyncio.run(run())
    return 0
