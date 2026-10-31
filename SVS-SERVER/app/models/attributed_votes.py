from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import Field, Relationship, SQLModel, select

from app.db.db import db_session
from app.models.types import UTCDateTime, utcnow

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.vote import Vote


class AttributedVote(SQLModel, table=True):
    user_id: int | None = Field(default=None, primary_key=True, foreign_key="user.id")
    vote_id: int | None = Field(
        default=None,
        primary_key=True,
        foreign_key="vote.id",
        ondelete="CASCADE",
    )

    created_at: datetime = Field(default_factory=utcnow, sa_type=UTCDateTime)

    user_has_voted: bool = Field(default=False, description="Indicates if the user has cast their vote")

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

    @staticmethod
    @db_session
    async def roll_of(
        vote_id: int,
        page: int,
        per_page: int,
        search: str | None = None,
        db: AsyncSession | None = None,
    ) -> tuple[list, int]:
        """The people on the electoral roll of an election, a page of them, and how many there are (for the search, if any)."""
        from app.models.user import User

        if db is None:
            raise ValueError("Database session is None")
        matching = [AttributedVote.vote_id == vote_id]
        if search:
            like = f"%{search.strip()}%"
            matching.append(
                or_(
                    User.username.ilike(like),
                    User.email.ilike(like),
                    User.first_name.ilike(like),
                    User.last_name.ilike(like),
                )
            )
        base = select(User).join(AttributedVote, AttributedVote.user_id == User.id).where(*matching)
        total = (await db.execute(select(func.count()).select_from(base.subquery()))).scalar_one()
        users = (
            (
                await db.execute(
                    base.order_by(User.last_name, User.first_name, User.id)
                    .offset((page - 1) * per_page)
                    .limit(per_page)
                )
            )
            .scalars()
            .all()
        )
        return list(users), total
