from sqlmodel import SQLModel, Field
from datetime import datetime


class UsedToken(SQLModel, table=True):
    vote_id: int = Field(primary_key=True, foreign_key="vote.id")
    token_hash: str = Field(primary_key=True, max_length=256)
    used_at: datetime = Field(default_factory=datetime.utcnow)
