from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.config.env import env
from app.utils import get_real_path
from app.utils.middlewares import setup_middlewares
from app.middlewares.http_middleware import HTTP_MIDDLEWARE
from app.middlewares.cors_middleware import CORS_MIDDLEWARE


from app.utils.logging import setup_logging, intercept_standard_logging
from loguru import logger

# Setup logging BEFORE creating the FastAPI app
setup_logging()
intercept_standard_logging()

APP = FastAPI()

APP.mount("/public", StaticFiles(directory="app/dist"), name="public")


# Route to serve the main SPA page
@APP.get("/", response_class=FileResponse)
async def serve_spa():

    index_file_path = get_real_path("dist/index.html")
    return FileResponse(index_file_path)


# Catch-all route to serve index.html for SPA routing
@APP.get("*", response_class=FileResponse)
async def serve_spa_fallback(path: str):
    return await serve_spa()


@APP.post("/echo")
async def echo(data: dict):
    return data


# Setup middlewares
setup_middlewares(
    APP=APP,
    MIDDLEWARES=[
        CORS_MIDDLEWARE,
        HTTP_MIDDLEWARE,
    ],
)

logger.info(f"ENV_MODE: {env.ENV_MODE.value}")
