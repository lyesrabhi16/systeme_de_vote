import secrets
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import Field, Relationship, SQLModel

from app.db.db import db_session
from app.models.types import UTCDateTime

if TYPE_CHECKING:
    from app.models.vote import Vote


class Bulletin(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    vote_id: int | None = Field(default=None, index=True, foreign_key="vote.id")

    content: str = Field(
        ...,
        title="Content",
        sa_type=Text,
        description="Homomorphically encrypted ballot, with its proofs (JSON)",
    )
    date: datetime = Field(..., title="Date", sa_type=UTCDateTime)

    unique_code: str = Field(
        ...,
        max_length=1024,
        unique=True,
        default_factory=lambda: secrets.token_urlsafe(32),
        description="Unique code for the bulletin, used for verification",
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
