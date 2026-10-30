from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import Field, Relationship, SQLModel

from app.db.db import db_session

from .vote import Vote


class Candidate(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    first_name: str = Field(..., title="Name", max_length=100)
    last_name: str = Field(..., title="Last Name", max_length=100)
    photo_url: str | None = Field(
        default=None, title="Photo URL", max_length=500, nullable=True
    )

    # Plaintext result (POST-TALLY ONLY)
    vote_count: int | None = Field(
        default=0,
        title="Final vote count",
        description="Decrypted final count after tally",
    )
    vote_id: int = Field(
        ..., title="Vote ID", foreign_key="vote.id", ondelete="CASCADE"
    )

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

    @db_session
    async def delete(self, db: AsyncSession | None = None) -> None:
        """Delete the candidate from the database."""
        if db is None:
            raise ValueError("Database session is None")
        await db.delete(self)
        await db.commit()

    @staticmethod
    @db_session
    async def get_by_id(candidate_id: int, db: AsyncSession | None = None):
        """Retrieve a candidate by its ID."""
        if db is None:
            raise ValueError("Database session is None")
        candidate = await db.get(Candidate, candidate_id)
        return candidate


class CandidateCreateModel(BaseModel):
    first_name: str
    last_name: str
    photo_url: str | None = None
    vote_id: int | None = None


class CandidateUpdateModel(BaseModel):
    first_name: str
    last_name: str
    photo_url: str | None = None
