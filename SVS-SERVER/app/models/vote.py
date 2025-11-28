from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import SQLModel, Field, Relationship
from app.db.db import db_session
from datetime import datetime
from app.models.user import User


class Vote(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    titre: str = Field(..., title="Titre", max_length=200)
    description: str = Field(..., title="Description", max_length=1000)
    start_date: datetime = Field(..., title="Start Date")
    end_date: datetime = Field(..., title="End Date")
    creator_id: int = Field(..., title="Creator User ID", foreign_key="user.id")

    creator: User = Relationship(back_populates="created_votes")
    candidates: list["Candidate"] = Relationship(back_populates="vote")

    @db_session
    async def save(self, db: AsyncSession | None = None) -> None:
        """Save the modified vote to the database."""
        if db is None:
            raise ValueError("Database session is None")
        db.add(self)
        await db.commit()
        await db.refresh(self)
