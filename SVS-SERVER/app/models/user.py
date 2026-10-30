from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship, select
from pydantic import BaseModel
from app.db.db import db_session
from app.utils import auth_utils
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Request
from loguru import logger
from typing import Literal
from enum import Enum


class AuthorityEnum(str, Enum):
    Inscription = "Inscription"
    Vote = "Vote"


class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    first_name: str = Field(..., title="First Name", max_length=100)
    last_name: str = Field(..., title="Last Name", max_length=100)
    email: str = Field(..., title="Email", max_length=256, unique=True)
    verified_email: bool = Field(default=False, title="Verified Email")
    username: str = Field(..., title="Username", max_length=100, unique=True)
    password: str | None = Field(default=None, title="Password")
    phone_number: str = Field(..., title="Phone Number", max_length=100, unique=True)
    verified_phone_number: bool = Field(default=False, title="Verified Phone Number")
    is_active: bool = Field(default=True, title="Is Active")
    is_admin: bool = Field(..., title="Is Admin")
    # authority can be None for regular users, Inscription or Vote
    authority: AuthorityEnum | None = Field(
        default=None,
        title="Authority",
        max_length=20,
        nullable=True,
        index=True,
        description="Authority can be None for regular users, Inscription or Vote",
    )
    requested_password_reset: bool = Field(
        default=False, title="Requested Password Reset"
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.utcnow(), title="Created At"
    )

    # créer
    created_votes: list["Vote"] = Relationship(
        back_populates="creator",
        sa_relationship_kwargs={"lazy": "selectin"},  # async safe
    )
    # peut_voter
    attributed_votes: list["AttributedVote"] = Relationship(
        back_populates="user", sa_relationship_kwargs={"lazy": "selectin"}  # async safe
    )

    @db_session
    @staticmethod
    async def get_all_users(db: AsyncSession | None = None) -> list["User"]:
        """Retrieve all users from the database."""
        if db is None:
            raise ValueError("Database session is None")
        result = await db.execute(select(User))
        users = result.scalars().all()
        return users

    @staticmethod
    @db_session
    async def get_authenticated_user(
        request: Request, db: AsyncSession | None = None
    ) -> "User":
        """Retrieve the authenticated user from the request."""
        return request.state.user

    @staticmethod
    @db_session
    async def get_user_by_id(user_id: int, db: AsyncSession | None = None):
        if db is None:
            raise ValueError("Database session is None")
        user = await db.get(User, user_id)
        return user

    @db_session
    async def has_voted_on(
        self, vote: "Vote", token: str, db: AsyncSession | None = None
    ) -> bool:
        """Check if the user has voted on a specific vote."""
        from app.models import Bulletin, AttributedVote

        if db is None:
            raise ValueError("Database session is None")
        # check attributed vote
        attributed_vote = await db.get(AttributedVote, (self.id, vote.id))
        if attributed_vote is None:
            logger.warning(
                f"AttributedVote not found for user_id={self.id} and vote_id={vote.id} and check for user_has_voted_on has been initiated."
            )
            return False
        if not attributed_vote.user_has_voted:
            return False
        # check bulletin with token
        result = await db.execute(
            select(Bulletin).where(
                Bulletin.vote_id == vote.id,
                Bulletin.voting_token == token,
            )
        )
        bulletin = result.scalars().first()
        has_voted = bulletin is not None
        if has_voted:
            attributed_vote.user_has_voted = True
            await attributed_vote.save()
        return has_voted

    @db_session
    async def save(self, db: AsyncSession | None = None) -> None:
        """Save the modified user to the database."""
        if db is None:
            raise ValueError("Database session is None")
        db.add(self)
        await db.commit()
        await db.refresh(self)

    @db_session
    async def delete(self, db: AsyncSession | None = None) -> None:
        """Delete the user from the database."""
        if db is None:
            raise ValueError("Database session is None")
        await db.delete(self)
        await db.commit()

    def set_password(self, new_password: str) -> None:
        """Set a new password for the user."""
        self.password = auth_utils.hash_string(new_password)


class UserUpdateModel(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    email: str | None = None
    username: str | None = None
    phone_number: str | None = None
    is_admin: bool | None = None
    is_active: bool | None = None
    authority: Literal["Inscription", "Vote"] | None = None
    verified_email: bool | None = None
    verified_phone_number: bool | None = None
    password: str | None = None
    request_password_reset: bool = False


class UserCreationModel(BaseModel):
    first_name: str
    last_name: str
    email: str
    username: str
    phone_number: str
    password: str | None = None
    is_admin: bool
    authority: Literal["Inscription", "Vote"] | None = None


class UserResponseModel(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    username: str
    phone_number: str
    is_active: bool
    is_admin: bool
    authority: Literal["Inscription", "Vote"] | None = None

    @staticmethod
    @db_session
    async def from_user(user: User, db: AsyncSession | None = None):
        if db is None:
            raise ValueError("Database session is None")
        if user.id is None:
            raise ValueError("User ID is None")
        return UserResponseModel(
            id=user.id,
            first_name=user.first_name,
            last_name=user.last_name,
            email=user.email,
            username=user.username,
            phone_number=user.phone_number,
            is_active=user.is_active,
            is_admin=user.is_admin,
            authority=user.authority,
        )


class AdminUserResponseModel(UserResponseModel):
    """What the administrators of the users see of an account (never the password hash)."""

    verified_email: bool
    verified_phone_number: bool
    requested_password_reset: bool
    created_at: datetime

    @staticmethod
    def from_user(user: User) -> "AdminUserResponseModel":
        if user.id is None:
            raise ValueError("User ID is None")
        return AdminUserResponseModel(
            id=user.id,
            first_name=user.first_name,
            last_name=user.last_name,
            email=user.email,
            username=user.username,
            phone_number=user.phone_number,
            is_active=user.is_active,
            is_admin=user.is_admin,
            authority=user.authority,
            verified_email=user.verified_email,
            verified_phone_number=user.verified_phone_number,
            requested_password_reset=user.requested_password_reset,
            created_at=user.created_at,
        )


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
    authority: Literal["Inscription", "Vote"] | None = None
    unique_hash: str
    requested_password_reset: bool

    @staticmethod
    def from_user(user: User) -> "CurrentUserResponseModel":
        if user.id is None:
            raise ValueError("User ID is None")
        unique_hash = auth_utils.generate_unique_hash(
            user_id=str(user.id),
            email=user.email,
            created_at=user.created_at,
            password=user.password,
        )
        return CurrentUserResponseModel(
            id=user.id,
            first_name=user.first_name,
            last_name=user.last_name,
            email=user.email,
            verified_email=user.verified_email,
            username=user.username,
            phone_number=user.phone_number,
            verified_phone_number=user.verified_phone_number,
            is_active=user.is_active,
            is_admin=user.is_admin,
            authority=user.authority,
            unique_hash=unique_hash,
            requested_password_reset=user.requested_password_reset,
        )


class SuccessfulUserLoginResponseModel(BaseModel):
    id: str
    masked_email: str
    first_login: bool

    @staticmethod
    async def from_user(user: User) -> "SuccessfulUserLoginResponseModel":
        masked_email = SuccessfulUserLoginResponseModel.mask_email(user.email)
        encrypted_email = auth_utils.encrypt_string(user.email)
        encrypted_id = await auth_utils.generate_temp_url_safe_string(encrypted_email)
        return SuccessfulUserLoginResponseModel(
            id=encrypted_id,
            masked_email=masked_email,
            first_login=user.password is None,
        )

    @staticmethod
    def mask_email(email: str) -> str:
        """Mask the email address for privacy ("a***e@e*****e.com")."""

        def mask(part: str) -> str:
            if len(part) <= 2:
                return part[:1] + "*" * (len(part) - 1)
            return part[0] + "*" * (len(part) - 2) + part[-1]

        local_part, _, domain = email.rpartition("@")
        return f"{mask(local_part)}@{mask(domain)}"
