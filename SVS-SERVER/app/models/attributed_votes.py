from sqlmodel import SQLModel, Field, Relationship
from app.db.db import db_session
from sqlalchemy.ext.asyncio import AsyncSession


class AttributedVote(SQLModel, table=True):
    user_id: int | None = Field(default=None, primary_key=True, foreign_key="user.id")
    vote_id: int | None = Field(default=None, primary_key=True, foreign_key="vote.id")

    user: "User" = Relationship(
        back_populates="attributed_votes",
        sa_relationship_kwargs={"lazy": "selectin"},  # async safe
    )
    vote: "Vote" = Relationship(
        back_populates="attributed_users",
        sa_relationship_kwargs={"lazy": "selectin"},  # async safe
    )
