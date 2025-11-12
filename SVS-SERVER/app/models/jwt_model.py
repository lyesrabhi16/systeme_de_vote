from pydantic import BaseModel


class JWT_DATA(BaseModel):
    id: int
    exp: int | None = None


class TokenInput(BaseModel):
    token: str | None = None


class TokenResponse(BaseModel):
    token: str
