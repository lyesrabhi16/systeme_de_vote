from pydantic import BaseModel
from typing import Any


class MessageResponse(BaseModel):
    message: str

class BooleanResponse(BaseModel):
    result: bool


class ErrorResponse(BaseModel):
    detail: Any


