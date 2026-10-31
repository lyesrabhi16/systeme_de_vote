"""
Bringing the database to the schema of the code, with Alembic (the migrations are in migrations/versions):

    python -m app.db.migrate          # upgrade to the latest revision (adopting a database that has tables but no history)
    python -m app.db.migrate --check  # change nothing; exit 1 if the database is not at the latest revision

In production this runs once per deployment, before the application starts (the `migrate` service of docker-compose.yml, an init
container in the Kubernetes manifest), and the application refuses to start on a database that is behind. Elsewhere (ENV_MODE
development or testing, or AUTO_MIGRATE=true) the application does it itself when it starts.
"""

import asyncio
import os
import sys
from enum import Enum

from alembic import command
from alembic.config import Config
from alembic.runtime.migration import MigrationContext
from alembic.script import ScriptDirectory
from loguru import logger
from sqlalchemy import Text, inspect
from sqlalchemy.engine import URL, Connection
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine

from app.config.globals import BASE_DIR
from app.utils.db_utils import get_db_url

# the revision of the schema that `create_all` made before there were migrations (varchar columns), and the one that followed
BASELINE = "0001"
BALLOTS_ARE_TEXT = "0002"


class SchemaOutOfDate(RuntimeError):
    """The database is not at the latest revision: run `python -m app.db.migrate`."""


class State(Enum):
    VERSIONED = "has a migration history"
    EMPTY = "has no tables"
    LEGACY = "has the tables of the first version, made by create_all, and no history"
    LEGACY_TEXT = "has the tables of this version, made by create_all, and no history"


def alembic_config(url: URL | str | None = None) -> Config:
    config = Config(os.path.join(BASE_DIR, "alembic.ini"))
    config.set_main_option("script_location", os.path.join(BASE_DIR, "migrations"))
    if url is not None:
        config.attributes["url"] = url  # not a main option: a password may hold a % that ConfigParser would read
    return config


def head_revision() -> str:
    head = ScriptDirectory.from_config(alembic_config()).get_current_head()
    assert head is not None
    return head


def _state(connection: Connection) -> State:
    tables = set(inspect(connection).get_table_names())
    if "alembic_version" in tables:
        return State.VERSIONED
    if not tables & {"user", "vote", "bulletin"}:
        return State.EMPTY
    # a database made by create_all: which of the two versions of the schema? Its ballots tell (VARCHAR before, TEXT since)
    content = next(c for c in inspect(connection).get_columns("bulletin") if c["name"] == "content")
    return State.LEGACY_TEXT if isinstance(content["type"], Text) else State.LEGACY


def _revision(connection: Connection) -> str | None:
    return MigrationContext.configure(connection).get_current_revision()


async def _with_engine(url: URL | str | None, work):
    engine: AsyncEngine = create_async_engine(url or get_db_url())
    try:
        async with engine.connect() as connection:
            return await connection.run_sync(work)
    finally:
        await engine.dispose()


async def current_revision(url: URL | str | None = None) -> str | None:
    return await _with_engine(
        url, lambda c: _revision(c) if "alembic_version" in inspect(c).get_table_names() else None
    )


async def ensure_current(url: URL | str | None = None) -> None:
    """For a production start: the application does not touch the schema, and does not run on one that is behind."""
    current, head = await current_revision(url), head_revision()
    if current != head:
        raise SchemaOutOfDate(
            f"The database is at revision {current or 'none'}, the application needs {head}. "
            "Run `python -m app.db.migrate` (the `migrate` service of docker-compose.yml) before starting it."
        )


async def adopt_or_upgrade(url: URL | str | None = None) -> str:
    """
    Upgrades to the latest revision. A database that has the tables but no history (it was made by `create_all`, before there
    were migrations) is first stamped with the revision it is like, so that nothing is created twice. Answers the revision reached.
    """
    url = url or get_db_url()  # the same address for looking and for migrating
    state = await _with_engine(url, _state)
    config = alembic_config(url)
    # alembic runs its own event loop: in a thread of its own, it does not meet the one of the application
    if state is State.LEGACY:
        logger.warning(f"The database {state.value}: it is stamped {BASELINE}, then upgraded.")
        await asyncio.to_thread(command.stamp, config, BASELINE)
    elif state is State.LEGACY_TEXT:
        logger.warning(f"The database {state.value}: it is stamped {BALLOTS_ARE_TEXT}.")
        await asyncio.to_thread(command.stamp, config, BALLOTS_ARE_TEXT)
    await asyncio.to_thread(command.upgrade, config, "head")
    reached = await current_revision(url)
    if reached is None:
        # Some environments can finish an upgrade with the schema applied but without a revision row.
        logger.warning("Upgrade finished but no alembic revision was found; stamping the database at head.")
        await asyncio.to_thread(command.stamp, config, "head")
        reached = await current_revision(url)
    if reached is None:
        raise RuntimeError("Failed to determine database revision after upgrade/stamp.")
    return reached


async def _main(argv: list[str]) -> int:
    if "--check" in argv:
        try:
            await ensure_current()
        except SchemaOutOfDate as e:
            print(e, file=sys.stderr)
            return 1
        print(f"The database is at the latest revision ({head_revision()}).")
        return 0
    print(f"The database is at revision {await adopt_or_upgrade()}.")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(_main(sys.argv[1:])))
