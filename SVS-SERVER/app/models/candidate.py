from sqlmodel import SQLModel, Field, Relationship
from app.db.db import db_session
from sqlalchemy.ext.asyncio import AsyncSession
from .vote import Vote


class Candidate(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    first_name: str = Field(..., title="Name", max_length=100)
    last_name: str = Field(..., title="Last Name", max_length=100)
    photo_url: str | None = Field(
        default=None, title="Photo URL", max_length=500, nullable=True
    )
    vote_id: int = Field(..., title="Vote ID", foreign_key="vote.id")

    vote: Vote = Relationship(
        back_populates="candidates",
        sa_relationship_kwargs={"lazy": "selectin"},  # async safe
    )

    @db_session
    async def save(self, db: AsyncSession | None = None) -> None:
        """Save the modified candidate to the database."""
        if db is None:
            raise ValueError("Database session is None")
        db.add(self)
        await db.commit()
        await db.refresh(self)
