from redis.asyncio import Redis
from sqlalchemy import URL

from app.config.env import env


def get_db_url() -> URL:
    """Constructs and returns the database URL from environment variables."""
    if env.DB_DRIVER.startswith(
        "sqlite"
    ):  # a file (DB_NAME), for the tests and for trying the project without PostgreSQL
        return URL.create(drivername=env.DB_DRIVER, database=env.DB_NAME or ":memory:")
    return URL.create(
        drivername=env.DB_DRIVER,
        username=env.DB_USER or None,
        password=env.DB_PASSWORD or None,
        host=env.DB_HOST,
        port=env.DB_PORT,
        database=env.DB_NAME,
    )


def get_redis_connection() -> Redis:
    return Redis(
        host=env.REDIS_HOST,
        port=env.REDIS_PORT,
        db=env.REDIS_DB,
        decode_responses=True,
        username=env.REDIS_USER or None,
        password=env.REDIS_PASSWORD or None,
        encoding="utf-8",
    )
