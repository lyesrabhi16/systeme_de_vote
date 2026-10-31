"""
How Alembic reaches the database and the models.

The database URL comes from the application's configuration (`app.config.env`), not from
alembic.ini, so migrations always target the same database as the app.
Tests and one-off commands can override it through `config.attributes["url"]`.
"""

import asyncio

from alembic import context
from sqlalchemy import pool, text
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import SQLModel

import app.models  # noqa: F401  (registers models in SQLModel.metadata)
from app.utils.db_utils import get_db_url

config = context.config
target_metadata = SQLModel.metadata

# Prevent concurrent app replicas from trying to run migrations at the same time on PostgreSQL.
MIGRATION_LOCK = 727_274


def database_url():
    return config.attributes.get("url") or config.get_main_option("sqlalchemy.url") or get_db_url()


def run_migrations_offline() -> None:
    """Write SQL without connecting to the database (e.g. `alembic upgrade --sql`)."""
    context.configure(
        url=database_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        compare_type=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
        # SQLite cannot ALTER COLUMN directly; batch mode rebuilds tables when needed.
        render_as_batch=connection.dialect.name == "sqlite",
        transaction_per_migration=True,
    )
    is_postgres = connection.dialect.name == "postgresql"
    if is_postgres:
        connection.execute(text("SELECT pg_advisory_lock(:key)"), {"key": MIGRATION_LOCK})
    try:
        with context.begin_transaction():
            context.run_migrations()
    finally:
        if is_postgres:
            connection.execute(text("SELECT pg_advisory_unlock(:key)"), {"key": MIGRATION_LOCK})


async def run_migrations_online() -> None:
    engine = create_async_engine(database_url(), poolclass=pool.NullPool)
    async with engine.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await engine.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
