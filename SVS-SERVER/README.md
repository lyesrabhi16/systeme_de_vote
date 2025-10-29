# SVS-SERVER — Implementation Notes

This document summarizes the recent implementation work in `SVS-SERVER` (branch: `HTTPS-CONFIG`). It describes what changed, why the changes were made, how to run and verify locally, troubleshooting steps, and recommended next steps.

## Summary

- Fixed module import reliability for the `utils` package so helper functions (for example, `get_real_path`) can be imported reliably when running the server from the project root, in containers, or from different working directories.
- Clarified and consolidated HTTPS / TLS configuration and certificates used by the server. This change ensures the server can be started with TLS in development and containerized environments when certs are present.

## Files of interest

- `SVS-SERVER/main.py` — server entrypoint. Small, pragmatic fixes may be applied here to ensure imports resolve when executed as a script.
- `SVS-SERVER/utils/__init__.py` — exposes helpers from `utils/utils.py` and makes `utils` a proper package.
- `SVS-SERVER/utils/utils.py` — utility helper functions used across the server (e.g., filesystem helpers).
- `SVS-SERVER/certs/` — TLS certs and keys used by the HTTPS configuration.
- `docker-compose.yml`, `Dockerfile`, `tls.yml` — container-related configuration and TLS setup (verify if you use containers).

If you want to quickly inspect the helpers, open `SVS-SERVER/utils/utils.py` and `SVS-SERVER/utils/__init__.py`.

## What changed and why

1. Problem: `ImportError: No module named 'utils'` occurs when `main.py` or other scripts are executed from a working directory where Python's module search path doesn't include the repository root.

2. Root causes:

   - Running `python SVS-SERVER/main.py` directly from outside the package root can leave Python's `sys.path` without the project root.
   - A missing or incomplete `__init__.py` in `SVS-SERVER/utils/` can prevent `utils` from being recognized as a package.

3. Fixes applied / recommended:

   - Ensure `SVS-SERVER/utils/__init__.py` exists and re-exports public helpers (for example: `from .utils import get_real_path`).
   - Add a small, explicit path-guard at the top of `SVS-SERVER/main.py` (optional pragmatic fix) that inserts the repo root into `sys.path` when the script is executed directly. This makes local runs and container entrypoints robust.
   - For production/long-term: make `SVS-SERVER` an installable package (via `pyproject.toml` or `setup.cfg`) and use editable installs during development. That removes the need for runtime `sys.path` patches.

4. added HTTPS configuration

## How to run

From the SVS-SERVER root, you should be able to run the server entrypoint and tests:

```bash
# build and deploy the client(frontend) if necessary
make deploy

# Run the server (development)
make run-dev

# or Run the server (production)
make run-production

# you can also Run tests for the server module
pipenv run pytest
```

Docker/compose:
start the svs-server and traefik containers with https enabled and the web application can be accessed via the url: https://svs-server.localhost

```bash
# build and deploy the client(frontend)
make deploy

# generate the certificates
make generate-certs

# start the containers
docker compose up -d
```

# Note:
To use HTTPS for local development, the [ca.crt](certs/ca.crt) must be trusted by your browser or by the system as a certificate authority.
