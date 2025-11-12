from typing import Optional, Tuple
from pydantic import BaseModel
from sqlalchemy import Row
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from .user import User
from app.db import db_session
from app.utils import auth_utils
from loguru import logger
from enum import Enum


class identifierType(Enum):
    EMAIL = "email"
    USERNAME = "username"
    PHONE_NUMBER = "phone_number"
    SSN = "ssn"

    def get_user_field(self) -> str:
        match self:
            case identifierType.EMAIL:
                return User.email
            case identifierType.USERNAME:
                return User.username
            case identifierType.PHONE_NUMBER:
                return User.phone_number
            case identifierType.SSN:
                return User.ssn
            case _:
                raise ValueError(f"Invalid identifier type: {self}")


class UserLoginModel(BaseModel):
    identifier: str
    password: str
    remember_me: Optional[bool] = False
    identifier_type: identifierType

    @classmethod
    @db_session
    async def authenticate(
        cls,
        identifier: str,
        password: str,
        identifier_type: identifierType,
        db: AsyncSession | None = None,
    ) -> User | None:
        if db is None:
            return None
        user_row = (
            await db.execute(
                select(User).where(identifier_type.get_user_field() == identifier)
            )
        ).one_or_none()
        logger.debug(
            f"Authenticating user: {identifier}, Found: {user_row is not None}"
        )
        if user_row is not None:
            user: User = user_row[0]
            if (
                (user_row is not None)
                and (user := user_row[0])
                and (auth_utils.verify_hash(password, user.password))
            ):
                logger.debug(f"User authenticated successfully: {user.email}")
                return user
        logger.warning(f"User authentication failed: {identifier}")
        return None

    @classmethod
    @db_session
    async def get_current_user(
        cls, token: str, db: AsyncSession | None = None
    ) -> User | None:
        if db is None:
            return None
        try:
            payload = auth_utils.verify_token(token)
            if payload.id is None:
                logger.warning("Token does not contain user ID.")
                return None
            user: Row[Tuple[User]] | None = (
                await db.execute(select(User).where(User.id == payload.id))
            ).one_or_none()
            if user is None:
                logger.warning(f"User not found for ID: {payload.id}")
                return None
            logger.debug(f"Current user retrieved successfully: ID {payload.id}")
            return user[0]
        except Exception as e:
            logger.error(f"Error retrieving current user from token: {e}")
            return None
