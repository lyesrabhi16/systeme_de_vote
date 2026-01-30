from sqlmodel import SQLModel, Field
from app.db.db import db_session
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from sqlmodel import Relationship


class Bulletin(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    vote_id: int | None = Field(default=None, index=True, foreign_key="vote.id")

    content: str = Field(
        ...,
        title="Content",
        max_length=4000,
        description="Homomorphically encrypted ballot",
    )
    date: datetime = Field(..., title="Date")

    voting_token: str = Field(
        ..., max_length=512, description="Unblinded anonymous voting token"
    )
    token_signature: str = Field(
        ..., max_length=1024, description="Authority signature over voting token"
    )

    vote: "Vote" = Relationship(
        back_populates="bulletins",
        sa_relationship_kwargs={"lazy": "selectin"},  # async safe
    )

    @db_session
    async def save(self, db: AsyncSession | None = None) -> None:
        """Save the modified bulletin to the database."""
        if db is None:
            raise ValueError("Database session is None")
        db.add(self)
        await db.commit()
        await db.refresh(self)
