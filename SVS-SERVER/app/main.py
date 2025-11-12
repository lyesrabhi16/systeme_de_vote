from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.config.env import env
from app.utils import get_real_path
from app.utils.middlewares import setup_middlewares
from app.middlewares.http_middleware import HTTP_MIDDLEWARE
from app.middlewares.cors_middleware import CORS_MIDDLEWARE
from app.routers import auth_router
from app.db import test_db_connection, init_db

from app.utils.logging import setup_logging, intercept_standard_logging
from loguru import logger
from app.utils.openapi import setup_openapi

# Setup logging BEFORE creating the FastAPI app
setup_logging()
intercept_standard_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    # Test database connection
    connected = await test_db_connection()
    if not connected:
        logger.error("Failed to connect to the database on startup.")
    # Initialize the database if needed
    await init_db()

    yield
    # Shutdown


APP = FastAPI(lifespan=lifespan)


APP.mount("/public", StaticFiles(directory="app/dist"), name="public")


# Route to serve the main SPA page
@APP.get("/", response_class=FileResponse, operation_id="serve_spa")
async def serve_spa():

    index_file_path = get_real_path("app/dist/index.html")
    return FileResponse(index_file_path)


# Include API routers
APP.include_router(
    auth_router.router,
    prefix="/auth",
    tags=["auth"],
)


# Catch-all route to serve index.html for SPA routing
@APP.get("/{path:path}", response_class=FileResponse, operation_id="spa_fallback")
async def serve_spa_fallback(path: str):
    logger.debug(f"Fallback to spa route triggered for path: {path}, serving SPA index.html")
    return await serve_spa()


# Setup middlewares
setup_middlewares(
    APP=APP,
    MIDDLEWARES=[
        CORS_MIDDLEWARE,
        HTTP_MIDDLEWARE,
    ],
)

logger.info(f"ENV_MODE: {env.ENV_MODE.value}")

# setup openapi
setup_openapi(APP)
