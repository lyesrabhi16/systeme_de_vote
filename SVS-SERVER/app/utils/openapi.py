from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi
import json
from loguru import logger
from app.config.env import env


def setup_openapi(app: FastAPI):
    """
    Setup OpenAPI documentation for the FastAPI app.
    """
    logger.info("Setting up OpenAPI documentation")
    app.docs_url = "/docs"
    app.redoc_url = "/redoc"

    def custom_openapi():
        if app.openapi_schema:
            logger.info("Using cached OpenAPI schema")
            return app.openapi_schema
        openapi_schema = get_openapi(
            title="SVS Server API",
            version="1.0.0",
            description="API documentation for the SVS Server application.",
            routes=app.routes,
        )
        # logo replacement
        openapi_schema["info"]["x-logo"] = {"url": f"{env.HOST_URL}/public/logo.png"}
        app.openapi_schema = openapi_schema
        return app.openapi_schema

    app.openapi = custom_openapi
    with open("openapi.json", "w") as f:
        json.dump(app.openapi(), f, indent=4)
    logger.info("OpenAPI documentation setup complete")
