from typing import Optional, Tuple
from pydantic import BaseModel
from sqlalchemy import Row
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from .user import User
from app.db import db_session
from app.utils import auth_utils
from loguru import logger


class UserLoginModel(BaseModel):
    username: str
    password: str
    remember_me: Optional[bool] = False

    @classmethod
    @db_session
    async def authenticate(
        cls, username: str, password: str, db: AsyncSession | None = None
    ) -> User | None:
        if db is None:
            return None
        user = (
            await db.execute(select(User).where(User.username == username))
        ).one_or_none()
        logger.debug(f"Authenticating user: {username}, Found: {user is not None}")
        if user is not None:
            user = user[0]
        if user and auth_utils.verify_hash(password, user.password):
            logger.debug(f"User authenticated successfully: {username}")
            return user
        logger.warning(f"User authentication failed: {username}")
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
