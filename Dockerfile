# One image: the API, with the web client built into it.   docker build -t svs .
# Build from the root of the repository (the client and the server are both needed).

# ---- the web client
FROM oven/bun:1-alpine AS client
WORKDIR /client
COPY SVS-CLIENT/package.json SVS-CLIENT/bun.lock ./
RUN bun install --frozen-lockfile
COPY SVS-CLIENT/ ./
RUN bun run build

# ---- the API
FROM python:3.15-slim AS server
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1
WORKDIR /srv

# exactly what uv.lock says (--frozen: it is never re-resolved), the dependencies only: the code is copied after, so that a change of code does not reinstall them
COPY SVS-SERVER/pyproject.toml SVS-SERVER/uv.lock ./
RUN pip install uv && uv sync --frozen --no-dev --no-install-project

ENV PATH="/srv/.venv/bin:${PATH}"

COPY SVS-SERVER/app ./app
COPY SVS-SERVER/migrations ./migrations
COPY SVS-SERVER/alembic.ini ./
COPY SVS-SERVER/openapi.json ./
COPY --from=client /client/dist ./app/dist

# not root: the application writes only its logs
RUN useradd --system --uid 10001 --home-dir /srv svs \
    && mkdir -p /srv/logs \
    && chown -R svs:svs /srv/logs
USER svs

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD python -c "import urllib.request as u; u.urlopen('http://127.0.0.1:8000/openapi.json', timeout=4)" || exit 1

# FORWARDED_ALLOW_IPS: which proxies may tell the application the visitor's address and whether it was https (X-Forwarded-*).
# The port is not published in the compose files, so the only way in is the proxy: "*" is what it should be there.
ENV FORWARDED_ALLOW_IPS=127.0.0.1
CMD ["uvicorn", "app.main:APP", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers"]
