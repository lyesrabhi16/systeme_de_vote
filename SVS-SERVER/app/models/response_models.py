from typing import Any

from pydantic import BaseModel


class MessageResponse(BaseModel):
    message: str

class BooleanResponse(BaseModel):
    result: bool


class ErrorResponse(BaseModel):
    detail: Any


