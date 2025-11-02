from sqlmodel import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from app.utils.db_utils import get_db_url
from functools import wraps
from loguru import logger
from app.config.env import env

_db_url = get_db_url()
engine = create_async_engine(_db_url, echo=env.DEBUG, future=True)


def db_session(func):
    """
    decorator to provide a database session accessible via 'db' parameter on the decorated function

    Usage:
        @db_session
        def my_function(..., db: Session):
            ...
    """

    @wraps(func)
    async def wrapper(*args, **kwargs):
        Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=True)
        async with Session() as session:
            return await func(*args, **kwargs, db=session)

    return wrapper


@db_session
async def test_db_connection(db: AsyncSession | None = None) -> bool:
    """Test database connection by executing a simple query"""
    try:
        result = await db.execute(text("SELECT 1"))
        result.scalar_one()
        logger.info("DB connected")
        return True
    except Exception as e:
        logger.error(f"DB Connection failed: {e}")
        return False
