from pydantic import BaseModel


class JWT_DATA(BaseModel):
    id: int
    exp: int | None = None


class TokenDTO(BaseModel):
    token: str | None = None
