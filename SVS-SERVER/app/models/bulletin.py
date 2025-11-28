from sqlmodel import SQLModel, Field
from app.db.db import db_session
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from sqlmodel import Relationship


class Bulletin(SQLModel, table=True):
    user_id: int | None = Field(default=None, primary_key=True, foreign_key="user.id")
    vote_id: int | None = Field(default=None, primary_key=True, foreign_key="vote.id")

    content: str = Field(..., title="Content", max_length=2000)
    date: datetime = Field(..., title="Date")

    user: "User" = Relationship(back_populates="bulletins")
    vote: "Vote" = Relationship(back_populates="bulletins")

    @db_session
    async def save(self, db: AsyncSession | None = None) -> None:
        """Save the modified bulletin to the database."""
        if db is None:
            raise ValueError("Database session is None")
        db.add(self)
        await db.commit()
        await db.refresh(self)
