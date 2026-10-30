## ----------------------------------------------------------------------
## SVS-SERVER Makefile (run it from SVS-SERVER)
## ----------------------------------------------------------------------

help:     ## Show this help.
	@echo "Usage: make [COMMAND]"
	@echo ""
	@echo "Available targets:"
	@egrep -h '\s##\s' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m  %-24s\033[0m %s\n", $$1, $$2}'


install: ## Install the dependencies of the server and of its tests (use a virtual environment).
	pip install -r requirements-dev.txt

run-dev: ## Run the API with auto-reload on http://localhost:8000 (needs PostgreSQL and Redis: see .env.example).
	uvicorn app.main:APP --reload --host 127.0.0.1 --port 8000

test: ## Run the tests (no PostgreSQL, Redis or mail server needed).
	python -m pytest

lint: ## Check the style and the likely bugs (what CI checks).
	ruff check app
	ruff format --check app

format: ## Fix what can be fixed, and format the code.
	ruff check app --fix
	ruff format app

openapi: ## Write openapi.json (the web client's typed SDK is generated from it; a test checks it is up to date).
	python -m app.utils.openapi
	@echo "openapi.json written. Now: cd ../SVS-CLIENT && bun run generate-API-CLIENT"

build-client: ## Build the web client (SVS-CLIENT).
	cd ../SVS-CLIENT && bun install --frozen-lockfile && bun run build

deploy: build-client ## Put the built client where the API serves it (app/dist). The Docker image does this by itself.
	rm -rf ./app/dist
	cp -r ../SVS-CLIENT/dist ./app/dist

seed-demo: ## Add demo data: accounts, an open election, a counted one with real ballots (does nothing if there is data). Never in production.
	python -m app.db.seed_demo

seed-db: ## Add random data for the interface (asks whether to erase the database first). Never in production.
	python -m app.db.seed

seed-more-db: ## Add more random data for the interface (their ballots are not valid ones: such an election counts as empty).
	python -m app.db.seed_more_2

generate-certs: ## A local certificate authority and a certificate for svs-server.localhost (for ../docker-compose.yml).
	./scripts/generate-certs

update-requirements: ## Rewrite requirements.txt from the Pipfile (needs pipenv; the tests' tools are in requirements-dev.txt).
	pipenv requirements > requirements.txt
