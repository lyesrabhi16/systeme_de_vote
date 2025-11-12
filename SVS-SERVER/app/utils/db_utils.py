from sqlalchemy import URL
from app.config.env import env


def get_db_url() -> URL:
    """Constructs and returns the database URL from environment variables."""
    return URL.create(
        drivername=env.DB_DRIVER,
        username=env.DB_USER,
        password=env.DB_PASSWORD,
        host=env.DB_HOST,
        port=env.DB_PORT,
        database=env.DB_NAME,
    )
