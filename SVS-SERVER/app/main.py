from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.config.env import env
from app.utils import get_real_path


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


print(f"ENV_MODE: {env.ENV_MODE.value}")
