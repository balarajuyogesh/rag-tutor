.PHONY: help sync format lint fix build test dev debug run check clean start ingest migrate migrate-bootstrap migrate-apply migrate-status

UV_CACHE_DIR ?= $(CURDIR)/.uv-cache
POE = UV_CACHE_DIR="$(UV_CACHE_DIR)" uv run poe

help:
	@echo "Available commands:"
	@echo "  make sync              - install dependencies"
	@echo "  make lint              - run ruff"
	@echo "  make format            - format code"
	@echo "  make dev               - start FastAPI app"
	@echo "  make debug             - start FastAPI app in debug mode"
	@echo "  make migrate           - bootstrap + apply SurrealDB migrations"
	@echo "  make ingest            - embed and store the Vector Calculus PDF"
	@echo "  make start             - run checks, migrations, then start app"
	@echo "  make migrate-bootstrap - create namespace/database"
	@echo "  make migrate-apply     - apply all SurrealDB migrations"
	@echo "  make migrate-status   - list migration files"
	@echo ""
	@echo "Custom migration message:"
	@echo "  make migrate-status MESSAGE='Checking database state'"
	@echo "  make migrate-apply MESSAGE='Running migration batch 001'"
	@echo "  make migrate-bootstrap MESSAGE='Initializing SurrealDB'"

clean:
	@$(POE) clean

sync:
	@$(POE) sync

format:
	@$(POE) format

lint:
	@$(POE) lint

fix:
	@$(POE) fix

build:
	@$(POE) build

test:
	@$(POE) test

dev:
	@$(POE) dev

debug:
	@$(POE) debug

migrate:
	@$(POE) migrate

ingest:
	@$(POE) ingest

run: dev

check:
	@$(POE) lint

start:
	@$(POE) start

migrate-bootstrap:
	@echo "${MESSAGE:-Bootstrapping SurrealDB namespace and database...}"
	@$(POE) migrate-bootstrap

migrate-apply:
	@echo "${MESSAGE:-Applying SurrealDB migrations...}"
	@$(POE) migrate-apply

migrate-status:
	@echo "${MESSAGE:-Checking SurrealDB migration status...}"
	@$(POE) migrate-status
