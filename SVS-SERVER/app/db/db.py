from collections.abc import AsyncGenerator
from functools import wraps
from typing import Any

from loguru import logger
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlmodel import text

from app.config.env import env
from app.utils.db_utils import get_db_url, get_redis_connection

# DB
_db_url = get_db_url()
engine = create_async_engine(_db_url, future=True)  # no echo: the SQL would show what is voted

# Redis Cache
cache_db = get_redis_connection()


def cache_session(func):
    """
    decorator to provide a redis cache session accessible via 'cache' parameter on the decorated function

    Usage:
        @cache_session
        def my_function(..., cache: Redis):
            ...
    """
    annotations = func.__annotations__.get("return", Any)

    @wraps(func)
    async def wrapper(*args, **kwargs):
        # ------------------------------------------------------------------
        # Preserve the original signature
        # ------------------------------------------------------------------
        wrapper.__annotations__ = func.__annotations__.copy()
        wrapper.__annotations__["return"] = annotations

        return await func(*args, **kwargs, cache=cache_db)

    return wrapper


def db_session(func):
    """
    decorator to provide a database session accessible via 'db' parameter on the decorated function

    Usage:
        @db_session
        def my_function(..., db: Session):
            ...
    """
    Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=True)

    annotations = func.__annotations__.get("return", Any)

    @wraps(func)
    async def wrapper(*args, **kwargs):
        # ------------------------------------------------------------------
        # Preserve the original signature
        # ------------------------------------------------------------------
        wrapper.__annotations__ = func.__annotations__.copy()
        wrapper.__annotations__["return"] = annotations

        async with Session() as session:
            return await func(*args, **kwargs, db=session)

    return wrapper


async def get_db_session() -> AsyncGenerator[AsyncSession]:
    """Get a new database session."""
    Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=True)
    async with Session() as session:
        yield session


@db_session
async def test_db_connection(db: AsyncSession | None = None):
    """Test database connection by executing a simple query"""
    if db is None:
        return False
    try:
        result = await db.execute(text("SELECT 1"))
        result.scalar_one()
        logger.info(f"DB({env.DB_HOST}) connected")
        return True
    except Exception as e:
        logger.error(f"DB({env.DB_HOST}) Connection failed: {e}")
        return False


@cache_session
async def test_redis_cache_connection(cache: Redis | None = None):
    """Test cache connection by executing a simple command"""
    if cache is None:
        return False
    try:
        if await cache.ping():
            logger.info(f"Redis Cache({env.REDIS_HOST}) connected")
            return True
        else:
            logger.error(f"Redis Cache({env.REDIS_HOST}) Ping failed")
            return False
    except Exception as e:
        logger.error(f"Redis Cache({env.REDIS_HOST}) Connection failed: {e}")
        return False


@db_session
async def init_db(recreate: bool = False, db: AsyncSession | None = None):
    """Initialize the database (e.g., create tables)"""
    # Import models to register them with SQLModel metadata
    from sqlmodel import SQLModel

    import app.models  # noqa: F401

    if not SQLModel.metadata.tables:
        logger.info("No models found to create tables.")
        return
    else:
        logger.debug(f"Found models: {list(SQLModel.metadata.tables.keys())}")

    logger.info("Initializing database...")
    async with engine.begin() as conn:
        if recreate:
            logger.info("Recreating database tables...")
            await conn.run_sync(SQLModel.metadata.drop_all)
        await conn.run_sync(SQLModel.metadata.create_all)
    logger.info("Database initialized")
