from fastapi import FastAPI

APP = FastAPI()


@APP.get("/")
async def read_root():
    return {"Hello": "World"}
