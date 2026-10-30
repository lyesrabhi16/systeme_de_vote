import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.config.env import env
from app.models.error_codes import ERROR_CODES
from app.utils import get_real_path
from app.utils.middlewares import setup_middlewares, register_http_exception_handler
from app.middlewares.http_middleware import HTTP_MIDDLEWARE
from app.middlewares.cors_middleware import CORS_MIDDLEWARE
from app.routers import (
    auth_router,
    bulletins_router,
    voting_router,
    users_router,
    candidates_router,
    admin_router,
)
from app.db import test_db_connection, init_db, test_redis_cache_connection

from app.utils.logging import setup_logging, intercept_standard_logging
from loguru import logger
from app.utils.openapi import setup_openapi
from app.crons import start_crons

# Setup logging BEFORE creating the FastAPI app
setup_logging()
intercept_standard_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    # test redis connection
    redis_connected = await test_redis_cache_connection()
    if not redis_connected:
        logger.error("Failed to connect to the Redis cache on startup.")
    # Test database connection
    connected = await test_db_connection()
    if not connected:
        logger.error("Failed to connect to the database on startup.")
    # Initialize the database if needed
    await init_db(recreate=False)

    if env.generated_secrets:
        logger.warning(
            f"{', '.join(env.generated_secrets)} not set: made up for this process (sessions, pending one-time passwords and the private keys of the elections do not survive a restart). "
            "Never do this in production, where the server refuses to start."
        )

    # Start cron jobs
    await start_crons(app)

    yield
    # Shutdown


APP = FastAPI(lifespan=lifespan)

# The web client, built into app/dist (make deploy, or the Dockerfile). The API works without it.
DIST_DIR = get_real_path("app", "dist")
if os.path.isdir(DIST_DIR):
    APP.mount("/public", StaticFiles(directory=DIST_DIR), name="public")


# Route to serve the main SPA page
@APP.get("/", response_class=FileResponse, operation_id="serve_spa")
async def serve_spa():
    index_file_path = os.path.join(DIST_DIR, "index.html")
    if not os.path.isfile(index_file_path):
        raise HTTPException(status_code=404, detail="The web client is not built (see the README).")
    return FileResponse(index_file_path)


# Include API routers
APP.include_router(
    auth_router.router,
    prefix="/api/auth",
    tags=["auth"],
)

APP.include_router(
    voting_router.router,
    prefix="/api/vote",
    tags=["vote"],
)

APP.include_router(
    users_router.router,
    prefix="/api/users",
    tags=["users"],
)

APP.include_router(
    candidates_router.router,
    prefix="/api/candidates",
    tags=["candidates"],
)
APP.include_router(
    bulletins_router.router,
    prefix="/api/bulletins",
    tags=["bulletins"],
)

APP.include_router(
    admin_router.router,
    prefix="/api/admin",
    tags=["admin"],
)


# The API lives under /api, and everything else is a route of the web client (served by index.html): /vote/12 is a page, /api/vote/12/ is data.
# (Without that split, reloading the page of an election answered with the JSON of the API.) An /api path that does not exist is a 404, not the page.
API_PREFIXES = ("api/", "docs", "redoc", "openapi.json", "public/")


@APP.get("/{path:path}", response_class=FileResponse, operation_id="spa_fallback", include_in_schema=False)
async def serve_spa_fallback(path: str):
    if path.startswith(API_PREFIXES):
        raise HTTPException(status_code=404, detail=ERROR_CODES.NOT_FOUND)
    return await serve_spa()


# Setup middlewares
setup_middlewares(
    APP=APP,
    MIDDLEWARES=[
        CORS_MIDDLEWARE,
        HTTP_MIDDLEWARE,
    ],
)
# register exception handlers
register_http_exception_handler(APP=APP)

logger.info(f"ENV_MODE: {env.ENV_MODE.value}")

# setup openapi
setup_openapi(APP)
