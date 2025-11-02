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
async def test_db_connection(db: AsyncSession | None = None):
    """Test database connection by executing a simple query"""
    try:
        result = await db.execute(text("SELECT 1"))
        result.scalar_one()
        logger.info("DB connected")
        return True
    except Exception as e:
        logger.error(f"DB Connection failed: {e}")
        return False


async def init_db(db: AsyncSession | None = None):
    """Initialize the database (e.g., create tables)"""
    # Import models to register them with SQLModel metadata
    import app.models  # noqa: F401
    from sqlmodel import SQLModel

    # check if already initialized
    if not SQLModel.metadata.tables:
        logger.info("No models found to create tables.")
        return
    else:
        logger.debug(f"Found models: {list(SQLModel.metadata.tables.keys())}")

    logger.info("Initializing database...")
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    logger.info("Database initialized")
