from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import SQLModel, Field, Relationship
from app.db.db import db_session
from datetime import datetime
from app.models.user import User


class Vote(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    title: str = Field(..., title="Titre", max_length=200)
    description: str = Field(..., title="Description", max_length=1000)
    start_date: datetime = Field(..., title="Start Date")
    end_date: datetime = Field(..., title="End Date")
    creator_id: int = Field(..., title="Creator User ID", foreign_key="user.id")

    creator: User = Relationship(back_populates="created_votes")

    candidates: list["Candidate"] = Relationship(
        back_populates="vote", sa_relationship_kwargs={"lazy": "selectin"}  # async safe
    )
    bulletins: list["Bulletin"] = Relationship(
        back_populates="vote", sa_relationship_kwargs={"lazy": "selectin"}  # async safe
    )
    attributed_users: list["AttributedVote"] = Relationship(
        back_populates="vote", sa_relationship_kwargs={"lazy": "selectin"}  # async safe
    )

    def is_vote_finished(self) -> bool:
        return self.end_date < datetime.utcnow()

    @staticmethod
    @db_session
    async def get_by_id(vote_id: int, db: AsyncSession | None = None):
        """Retrieve a vote by its ID."""
        if db is None:
            raise ValueError("Database session is None")
        vote = await db.get(Vote, vote_id)
        return vote

    @db_session
    async def save(self, db: AsyncSession | None = None) -> None:
        """Save the modified vote to the database."""
        if db is None:
            raise ValueError("Database session is None")
        db.add(self)
        await db.commit()
        await db.refresh(self)


class FinishedVoteResponseModel(SQLModel):
    vote: Vote
    total_bulletins: int
    candidate_results: dict[int, int]  # candidate_id -> number of votes
    abstention_count: int
    voter_count: int
    user_has_voted: bool
