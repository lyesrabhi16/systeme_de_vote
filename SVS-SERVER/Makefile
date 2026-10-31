## ----------------------------------------------------------------------
## SVS-SERVER Makefile (run it from SVS-SERVER)
## ----------------------------------------------------------------------

help:     ## Show this help.
	@echo "Usage: make [COMMAND]"
	@echo ""
	@echo "Available targets:"
	@egrep -h '\s##\s' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m  %-24s\033[0m %s\n", $$1, $$2}'


install: ## Install runtime and test dependencies from pyproject.toml.
	uv sync --dev

run-dev: ## Run the API with auto-reload on http://localhost:8000 (needs PostgreSQL and Redis: see .env.example).
	uv run uvicorn app.main:APP --reload --host 127.0.0.1 --port 8000

test: ## Run the tests (no PostgreSQL, Redis or mail server needed).
	uv run python -m pytest

lint: ## Check the style and the likely bugs (what CI checks).
	uv run ruff check app migrations
	uv run ruff format --check app migrations

format: ## Fix what can be fixed, and format the code.
	uv run ruff check app migrations --fix
	uv run ruff format app migrations

openapi: ## Write openapi.json (the web client's typed SDK is generated from it; a test checks it is up to date).
	uv run python -m app.utils.openapi
	@echo "openapi.json written. Now: cd ../SVS-CLIENT && bun run generate-API-CLIENT"

build-client: ## Build the web client (SVS-CLIENT).
	cd ../SVS-CLIENT && bun install --frozen-lockfile && bun run build

deploy: build-client ## Put the built client where the API serves it (app/dist). The Docker image does this by itself.
	rm -rf ./app/dist
	cp -r ../SVS-CLIENT/dist ./app/dist

seed-demo: ## Add demo data: accounts, an open election, a counted one with real ballots (does nothing if there is data). Never in production.
	uv run python -m app.db.seed_demo

seed-db: ## Add random data for the interface (asks whether to erase the database first). Never in production.
	uv run python -m app.db.seed

seed-more-db: ## Add more random data for the interface (their ballots are not valid ones: such an election counts as empty).
	uv run python -m app.db.seed_more_2

generate-certs: ## A local certificate authority and a certificate for svs-server.localhost (for ../docker-compose.yml).
	./scripts/generate-certs

update-requirements: ## Rewrite requirements*.txt (for those who do not use uv) from uv.lock.
	uv export --frozen --no-dev --no-emit-project --no-hashes --no-annotate --format requirements-txt > requirements.txt
	( echo "# What the tests and the checks need, on top of the server itself. Made by make update-requirements from uv.lock: do not edit."; echo "-r requirements.txt"; uv export --frozen --only-dev --no-emit-project --no-hashes --no-annotate --format requirements-txt | grep -v "^#" ) > requirements-dev.txt

## ---- the database schema (Alembic): see migrations/README.md
migrate: ## Bring the database to the latest schema (a database made before there were migrations is adopted, not recreated).
	uv run python -m app.db.migrate

migrate-check: ## Say whether the database is at the latest schema (exit 1 if not); changes nothing.
	uv run python -m app.db.migrate --check

migration: ## Write a migration from the change of the models: make migration m="what changed". Read it, then commit it.
	uv run alembic revision --autogenerate -m "$(m)"

migrate-sql: ## Print the SQL of the migrations a database at revision $(from) still needs, without running it: make migrate-sql from=0001
	uv run alembic upgrade $(from):head --sql
