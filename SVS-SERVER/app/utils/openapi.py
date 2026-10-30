import json

from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi
from loguru import logger



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
        openapi_schema["info"]["x-logo"] = {"url": "/public/logo.png"}  # relative: the description must not depend on where it was written
        app.openapi_schema = openapi_schema
        return app.openapi_schema

    app.openapi = custom_openapi
    logger.info("OpenAPI documentation setup complete")


def write_openapi(app: FastAPI, path: str = "openapi.json") -> None:
    """Writes the API description to a file (make openapi). The web client's typed SDK is generated from it."""
    with open(path, "w") as f:
        json.dump(app.openapi(), f, indent=4)
        f.write("\n")


if __name__ == "__main__":
    from app.main import APP

    write_openapi(APP)
