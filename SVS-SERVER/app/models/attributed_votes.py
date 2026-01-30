from sqlmodel import SQLModel, Field, Relationship, select
from datetime import datetime
from app.db.db import db_session
from sqlalchemy.ext.asyncio import AsyncSession


class AttributedVote(SQLModel, table=True):
    user_id: int | None = Field(default=None, primary_key=True, foreign_key="user.id")
    vote_id: int | None = Field(default=None, primary_key=True, foreign_key="vote.id")

    blinded_token_hash: str | None = Field(
        default=None, max_length=512, description="Hash of the blinded voting token"
    )
    blind_signature: str | None = Field(
        default=None, max_length=1024, description="Signature over the blinded token"
    )
    signature_issued: bool = Field(default=False)

    created_at: datetime = Field(default_factory=datetime.utcnow)

    user_has_voted: bool = Field(
        default=False, description="Indicates if the user has cast their vote"
    )

    user: "User" = Relationship(
        back_populates="attributed_votes",
        sa_relationship_kwargs={"lazy": "selectin"},  # async safe
    )
    vote: "Vote" = Relationship(
        back_populates="attributed_users",
        sa_relationship_kwargs={"lazy": "selectin"},  # async safe
    )

    @db_session
    async def save(self, db: AsyncSession | None = None) -> None:
        """Save the modified attributed vote to the database."""
        if db is None:
            raise ValueError("Database session is None")
        db.add(self)
        await db.commit()
        await db.refresh(self)

    @staticmethod
    @db_session
    async def get_by_ids(user_id: int, vote_id: int, db: AsyncSession | None = None):
        if db is None:
            raise ValueError("Database session is None")
        result = await db.execute(
            select(AttributedVote).where(
                AttributedVote.user_id == user_id,
                AttributedVote.vote_id == vote_id,
            )
        )
        attributed_vote = result.scalars().first()
        return attributed_vote
