from enum import Enum

from loguru import logger
from pydantic import BaseModel
from sqlalchemy import Row
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.db import db_session
from app.utils import auth_utils

from .user import User


class identifierType(Enum):
    EMAIL = "email"
    USERNAME = "username"
    PHONE_NUMBER = "phone_number"

    def get_user_field(self) -> str:
        match self:
            case identifierType.EMAIL:
                return User.email
            case identifierType.USERNAME:
                return User.username
            case identifierType.PHONE_NUMBER:
                return User.phone_number
            case _:
                raise ValueError(f"Invalid identifier type: {self}")


class UserLoginModel(BaseModel):
    identifier: str
    password: str | None = None
    identifier_type: identifierType

    @classmethod
    @db_session
    async def get_user_by_email(cls, user_email: str, db: AsyncSession | None = None) -> User | None:
        if db is None:
            return None
        user_row: Row[tuple[User]] | None = (
            await db.execute(select(User).where(User.email == user_email))
        ).one_or_none()
        if user_row is not None:
            return user_row[0]
        logger.warning("User not found by email")
        return None

    @classmethod
    @db_session
    async def authenticate(
        cls,
        identifier: str,
        password: str | None,
        identifier_type: identifierType,
        db: AsyncSession | None = None,
    ) -> User | None:
        if db is None:
            return None
        user_row = (await db.execute(select(User).where(identifier_type.get_user_field() == identifier))).one_or_none()
        if user_row is None:
            auth_utils.burn_password_check(password)  # an unknown user must not be quicker to refuse than a known one
            logger.warning("User authentication failed")
            return None
        user: User = user_row[0]
        if user.is_active is False:
            auth_utils.burn_password_check(password)
            logger.warning("Inactive user attempted to authenticate")
            return None
        if user.password is None:
            # first login: no password has been chosen yet, the one-time password sent by email is the only factor
            if password is None:
                return user
        elif password is not None and auth_utils.verify_hash(password, user.password):
            return user
        logger.warning("User authentication failed")
        return None

    @classmethod
    @db_session
    async def get_current_user(cls, token: str, db: AsyncSession | None = None) -> User | None:
        if db is None:
            logger.error("No database session was provided.")
            return None
        try:
            payload = auth_utils.verify_token(token)
            if payload.id is None:
                logger.warning("Token does not contain user ID.")
                return None
            user: Row[tuple[User]] | None = (await db.execute(select(User).where(User.id == payload.id))).one_or_none()
            if user is None:
                logger.warning(f"User not found for ID: {payload.id}")
                return None
            return user[0]
        except Exception as e:
            logger.error(f"Error retrieving current user from token: {e}")
            return None
