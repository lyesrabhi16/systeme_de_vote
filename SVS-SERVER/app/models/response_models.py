from pydantic import BaseModel
from typing import Any


class MessageResponse(BaseModel):
    message: str


class ErrorResponse(BaseModel):
    detail: Any
