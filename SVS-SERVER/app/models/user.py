from sqlmodel import SQLModel, Field, Relationship
from pydantic import BaseModel
from app.db.db import db_session
from app.utils import auth_utils
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Request
from typing import Tuple
from loguru import logger


class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    first_name: str = Field(..., title="First Name", max_length=100)
    last_name: str = Field(..., title="Last Name", max_length=100)
    email: str = Field(..., title="Email", max_length=256, unique=True)
    verified_email: bool = Field(..., title="Verified Email")
    username: str = Field(..., title="Username", max_length=100, unique=True)
    password: str = Field(..., title="Password")
    ssn: str = Field(..., title="SSN", max_length=100, unique=True)
    phone_number: str = Field(..., title="Phone Number", max_length=100, unique=True)
    verified_phone_number: bool = Field(..., title="Verified Phone Number")
    is_active: bool = Field(..., title="Is Active")
    is_admin: bool = Field(..., title="Is Admin")

    # créer
    created_votes: list["Vote"] = Relationship(
        back_populates="creator",
        sa_relationship_kwargs={"lazy": "selectin"},  # async safe
    )
    # voter
    bulletins: list["Bulletin"] = Relationship(
        back_populates="user", sa_relationship_kwargs={"lazy": "selectin"}  # async safe
    )
    # peut_voter
    attributed_votes: list["AttributedVote"] = Relationship(
        back_populates="user", sa_relationship_kwargs={"lazy": "selectin"}  # async safe
    )

    @staticmethod
    @db_session
    async def get_authenticated_user(
        request: Request, db: AsyncSession | None = None
    ) -> "User":
        """Retrieve the authenticated user from the request."""
        return request.state.user

    @db_session
    async def save(self, db: AsyncSession | None = None) -> None:
        """Save the modified user to the database."""
        if db is None:
            raise ValueError("Database session is None")
        db.add(self)
        await db.commit()
        await db.refresh(self)


class CurrentUserResponseModel(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    verified_email: bool
    username: str
    phone_number: str
    verified_phone_number: bool
    is_active: bool
    is_admin: bool


class SuccessfulUserLoginResponseModel(BaseModel):
    id: str
    masked_email: str

    @staticmethod
    async def from_user(user: User) -> "SuccessfulUserLoginResponseModel":
        masked_email = SuccessfulUserLoginResponseModel.mask_email(user.email)
        encrypted_id = await auth_utils.encrypt_string(user.email)
        return SuccessfulUserLoginResponseModel(
            id=encrypted_id, masked_email=masked_email
        )

    @staticmethod
    def mask_email(email: str) -> str:
        """Mask the email address for privacy."""
        local_part, domain = email.split("@")
        masked_local = local_part[0] + "*" * (len(local_part) - 2) + local_part[-1]
        masked_domain = domain[0] + "*" * (len(domain) - 2) + domain[-1]
        return f"{masked_local}@{masked_domain}"
