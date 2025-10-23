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
	# check if all packages in requirements.txt are installed
	@pip freeze | grep -F -f requirements.txt > /dev/null || (echo "Some dependencies are missing. Please run 'make install'." && exit 1)
	@echo "\033[32mAll dependencies are installed.\033[0m"

run-dev: check-dependencies ## Run the FastAPI server in development mode.
	@echo "Starting FastAPI server in development mode..."
	pipenv run fastapi dev --host 0.0.0.0 --port 8000

run-production: check-dependencies ## Run the FastAPI server in production mode.
	@echo "Starting FastAPI server in production mode..."
	fastapi run --host 0.0.0.0 --port 80
