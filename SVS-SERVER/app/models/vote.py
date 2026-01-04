from typing import Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import SQLModel, Field, Relationship
from app.db.db import db_session
from datetime import datetime
from app.models.user import User, UserResponseModel


class Vote(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    title: str = Field(..., title="Titre", max_length=200)
    description: str = Field(..., title="Description", max_length=1000)
    start_date: datetime = Field(..., title="Start Date")
    end_date: datetime = Field(..., title="End Date")
    has_been_counted: bool = Field(
        default=False,
        title="Has Been Counted",
        description="Indicates if the vote has been counted",
    )
    creator_id: int = Field(..., title="Creator User ID", foreign_key="user.id")

    creator: User = Relationship(
        back_populates="created_votes",
        sa_relationship_kwargs={"lazy": "selectin"},
    )  # async safe

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
        return await db.get(Vote, vote_id)

    @db_session
    async def save(self, db: AsyncSession | None = None) -> None:
        """Save the modified vote to the database."""
        if db is None:
            raise ValueError("Database session is None")
        db.add(self)
        await db.commit()
        await db.refresh(self)


class VoteWithCreatorResponseModel(SQLModel):
    id: int
    title: str
    description: str
    start_date: datetime
    end_date: datetime
    has_been_counted: bool
    creator: UserResponseModel

    @staticmethod
    @db_session
    async def from_vote_id(
        vote_id: int,
        db: AsyncSession | None = None,
    ):
        if db is None:
            raise ValueError("Database session is None")
        vote = await Vote.get_by_id(vote_id)
        if vote is None:
            return None
        creator = await User.get_user_by_id(vote.creator_id)
        if not vote or not creator or creator.id is None or vote.id is None:
            return None
        return VoteWithCreatorResponseModel(
            id=vote.id,
            title=vote.title,
            description=vote.description,
            start_date=vote.start_date,
            end_date=vote.end_date,
            has_been_counted=vote.has_been_counted,
            creator=UserResponseModel(
                id=creator.id,
                first_name=creator.first_name,
                last_name=creator.last_name,
                email=creator.email,
                username=creator.username,
                phone_number=creator.phone_number,
                is_active=creator.is_active,
                is_admin=creator.is_admin,
            ),
        )


