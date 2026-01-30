from pydantic import BaseModel
from sqlmodel import SQLModel


class VoteCastData(SQLModel):
    token: str
    signature: str
    content: str


class BlindSignatureResponseModel(BaseModel):
    blinded_message: str
    blind_signature: str


class BlindSignatureRequestModel(BaseModel):
    blinded_message: str
