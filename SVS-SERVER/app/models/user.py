from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship, select
from pydantic import BaseModel
from app.db.db import db_session
from app.models.voting_models import VoteInputData
from app.utils import auth_utils
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, Request
from loguru import logger


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
    # voter
    bulletins: list["Bulletin"] = Relationship(
        back_populates="user", sa_relationship_kwargs={"lazy": "selectin"}  # async safe
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
    async def has_voted_on(self, vote: "Vote", db: AsyncSession | None = None) -> bool:
        """Check if the user has voted on a specific vote."""
        if db is None:
            raise ValueError("Database session is None")
        if not self.is_active:
            raise HTTPException(
                status_code=403,
                detail="User is not active and cannot vote",
            )
        logger.debug(f"user votes: {[b.vote.id for b in self.bulletins]}")
        has_voted = any(b.vote == vote for b in self.bulletins)
        logger.info(
            f"User {self.id} has {'not ' if not has_voted else ''}voted on vote {vote.id}"
        )
        return has_voted

    @db_session
    async def vote_on(
        self, vote: "Vote", data: VoteInputData, db: AsyncSession | None = None
    ):
        """Vote on a vote."""
        from app.models.bulletin import Bulletin

        if db is None:
            raise ValueError("Database session is None")
        if not self.is_active:
            raise HTTPException(
                status_code=403,
                detail="User is not active and cannot vote",
            )
        can_vote = self in vote.attributed_users and not self.has_voted_on(vote)
        if not self.is_admin and not can_vote:
            raise HTTPException(
                status_code=403,
                detail="User is not allowed to vote on this vote",
            )

        bulletin = Bulletin(
            user_id=self.id,
            vote_id=vote.id,
            content=auth_utils.encrypt_string(data.content),
            date=datetime.now(),
        )
        db.add(bulletin)
        await db.commit()

        logger.info(f"User {self.id} voted on vote {vote.id}")

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


class UserResponseModel(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    username: str
    phone_number: str
    is_active: bool
    is_admin: bool

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
    requested_password_reset: bool


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
        """Mask the email address for privacy."""
        local_part, domain = email.split("@")
        masked_local = local_part[0] + "*" * (len(local_part) - 2) + local_part[-1]
        masked_domain = domain[0] + "*" * (len(domain) - 2) + domain[-1]
        return f"{masked_local}@{masked_domain}"
