# This is a regular comment, that will not be displayed

## ----------------------------------------------------------------------
## SVS-SERVER Makefile
## ----------------------------------------------------------------------

help:     ## Show this help.
	@echo "Usage: make [COMMAND]"
	@echo ""
	@echo "Available targets:"
	@egrep -h '\s##\s' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m  %-30s\033[0m %s\n", $$1, $$2}'


install: ## Install all required dependencies.
	@echo "Installing dependencies..."
	@pip install -r requirements.txt
	@echo "\033[32mInstallation complete.\033[0m"

check-dependencies: ## Check if all required dependencies are installed.
	@echo "Checking dependencies..."
	@# check if all packages in requirements.txt are installed
	@pip freeze | grep -F -f requirements.txt > /dev/null || (echo "Some dependencies are missing. running 'make install'." && make install)
	@echo "\033[32mAll dependencies are installed.\033[0m"

run-dev: check-dependencies ## Run the FastAPI server in development mode.
	@echo "Starting FastAPI server in development mode..."
	pipenv run fastapi dev --host 0.0.0.0 --port 8000

run-production: check-dependencies ## Run the FastAPI server in production mode.
	@echo "Starting FastAPI server in production mode..."
	fastapi run --host 0.0.0.0 --port 8000

build-client: ## Build the SVS-CLIENT application.
	@echo "Building SVS-CLIENT application..."
	@cd ../SVS-CLIENT && bun install && bun run build
	@echo "\033[32mSVS-CLIENT build complete.\033[0m"

deploy: update-requirements build-client ## Deploy the built SVS-CLIENT application to the server's app directory.
	@echo "Deploying application..."
	@rm -rf ./app/dist && cp -r ../SVS-CLIENT/dist ./app/dist
	@echo "Recreating Docker containers..."
	@docker compose -f docker-compose.yml down
	@docker compose -f docker-compose.yml up -d --build
	@echo "\033[32mDocker containers recreated.\033[0m"
	@echo "\033[32mDeployment complete.\033[0m"

generate-certs: ## Generate SSL certificates for the server.
	@echo "Generating SSL certificates..."
	@chmod +x ./scripts/generate-certs
	@./scripts/generate-certs
	@echo "\033[32mSSL certificates generated.\033[0m"

update-requirements: ## Update the requirements.txt file with the latest dependencies.
	@echo "Updating requirements.txt..."
	@pipenv requirements > requirements.txt
	@echo "\033[32mrequirements.txt updated.\033[0m"

seed-db: ## Seed the database with initial data.
	@echo "Seeding the database..."
	@python -m app.db.seed
	@echo "\033[32mDatabase seeding complete.\033[0m"
seed-more-db: ## Seed the database with additional data.
	@echo "Seeding the database with more data..."
	@python -m app.db.seed_more_2
	@echo "\033[32mAdditional database seeding complete.\033[0m"
openapi: ## Write openapi.json (the web client's typed SDK is generated from it; a test checks it is up to date).
	python -m app.utils.openapi
	@echo "openapi.json written. Now: cd ../SVS-CLIENT && bun run generate-API-CLIENT"
