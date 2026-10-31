"""The migrations: a database is made, adopted and upgraded to the schema of the models, and nothing in it is lost."""

import asyncio
import re
from pathlib import Path

import pytest
from alembic import command
from alembic.autogenerate import compare_metadata
from alembic.runtime.migration import MigrationContext
from alembic.script import ScriptDirectory
from sqlalchemy import Text, create_engine, inspect, text
from sqlmodel import SQLModel

import app.models  # noqa: F401
from app.config.env import _ENV, ENV_MODES
from app.db import migrate
from app.db.migrate import (
    BALLOTS_ARE_TEXT,
    BASELINE,
    SchemaOutOfDate,
    State,
    _state,
    _with_engine,
    adopt_or_upgrade,
    alembic_config,
    current_revision,
    ensure_current,
    head_revision,
)


async def run(function, *args, **kwargs):
    """Alembic runs its own event loop: from a test (which has one running) it goes to a thread, as the application does."""
    return await asyncio.to_thread(function, *args, **kwargs)


ASYNC = "sqlite+aiosqlite:///{}"
SYNC = "sqlite:///{}"


@pytest.fixture
def db(tmp_path):
    """The address of an empty database file (not the one of the application: these tests make and break theirs)."""
    return ASYNC.format(tmp_path / "migrations.db"), SYNC.format(tmp_path / "migrations.db")


async def tables_and_types(url):
    def work(connection):
        i = inspect(connection)
        return {
            t: {c["name"]: c["type"] for c in i.get_columns(t)} for t in i.get_table_names() if t != "alembic_version"
        }

    return await _with_engine(url, work)


async def differences(url):
    """What `alembic revision --autogenerate` would write now: nothing, if the migrations make exactly the models."""

    def work(connection):
        return compare_metadata(MigrationContext.configure(connection, opts={"compare_type": True}), SQLModel.metadata)

    return await _with_engine(url, work)


def insert_a_bulletin(sync_url, content="x" * 10):
    engine = create_engine(sync_url)
    with engine.begin() as c:
        c.execute(
            text(
                "INSERT INTO user (id, first_name, last_name, email, verified_email, username, phone_number, verified_phone_number, is_active, is_admin, requested_password_reset, created_at) VALUES (1,'a','b','a@b.c',1,'a','1',1,1,1,0,'2030-01-01')"
            )
        )
        c.execute(
            text(
                "INSERT INTO vote (id, title, description, start_date, end_date, public_key, encrypted_private_key, has_been_counted, creator_id) VALUES (1,'t','d','2030-01-01','2030-01-02','k','p',0,1)"
            )
        )
        c.execute(
            text(
                "INSERT INTO bulletin (vote_id, content, date, unique_code) VALUES (1, :content, '2030-01-01', 'code')"
            ),
            {"content": content},
        )
    engine.dispose()


def bulletins(sync_url):
    engine = create_engine(sync_url)
    with engine.connect() as c:
        rows = c.execute(text("SELECT content, unique_code FROM bulletin")).all()
    engine.dispose()
    return rows


class TestTheHistory:
    def test_it_is_one_line_and_does_not_import_the_application(self):
        scripts = ScriptDirectory.from_config(alembic_config())
        assert scripts.get_heads() == [head_revision()] == [BALLOTS_ARE_TEXT]
        assert [s.revision for s in scripts.walk_revisions()] == [BALLOTS_ARE_TEXT, BASELINE]
        for path in (Path(__file__).parents[2] / "migrations" / "versions").glob("*.py"):
            source = path.read_text()
            # a migration says what the database was: when the models change, it must not
            assert not re.search(r"^\s*(from|import) app\b", source, re.M), path.name

    def test_production_does_not_migrate_by_itself_and_the_other_modes_do(self):
        assert not _ENV(ENV_MODE="development").AUTO_MIGRATE and _ENV(ENV_MODE="development").auto_migrate
        assert _ENV(ENV_MODE="testing").auto_migrate
        production = {
            "ENV_MODE": "production",
            "JWT_SECRET_KEY": "j" * 40,
            "ENCRYPTION_KEY": "x",
            "ALLOWED_ORIGINS": "https://a.example",
        }
        from cryptography.fernet import Fernet

        production |= {
            "ENCRYPTION_KEY": Fernet.generate_key().decode(),
            "SMTP_HOST": "smtp.example.org",
            "SMTP_SENDER_EMAIL": "v@example.org",
        }
        assert _ENV(**production).ENV_MODE == ENV_MODES.PRODUCTION and not _ENV(**production).auto_migrate
        assert _ENV(**production, AUTO_MIGRATE=True).auto_migrate  # a single-instance deployment may choose it
        assert not _ENV(ENV_MODE="development", AUTO_MIGRATE=False).auto_migrate


class TestAnEmptyDatabase:
    async def test_it_gets_every_table_of_the_models_and_nothing_else_is_missing(self, db):
        url, _ = db
        assert await adopt_or_upgrade(url) == head_revision()
        assert set(await tables_and_types(url)) == set(SQLModel.metadata.tables)
        assert await differences(url) == []  # `alembic check` in a test: models and migrations agree

    async def test_upgrading_again_does_nothing(self, db):
        url, sync = db
        await adopt_or_upgrade(url)
        insert_a_bulletin(sync)
        assert await adopt_or_upgrade(url) == head_revision()
        assert len(bulletins(sync)) == 1

    async def test_ballots_are_text(self, db):
        url, _ = db
        await adopt_or_upgrade(url)
        types = await tables_and_types(url)
        for table, column in (("bulletin", "content"), ("vote", "encrypted_tally"), ("vote", "tally_proof")):
            assert isinstance(types[table][column], Text), (table, column)

    async def test_it_is_recognised_as_empty(self, db):
        url, _ = db
        assert await _with_engine(url, _state) is State.EMPTY


class TestADatabaseMadeBeforeThereWereMigrations:
    """What `create_all` made: no history. It must be adopted, not created again, and keep what it holds."""

    async def test_a_database_of_the_first_version_is_stamped_then_upgraded(self, db):
        url, sync = db
        await run(command.upgrade, alembic_config(url), BASELINE)  # what create_all made then: bounded columns
        engine = create_engine(sync)
        with engine.begin() as c:
            c.execute(text("DROP TABLE alembic_version"))  # ... and which had no history
        engine.dispose()
        insert_a_bulletin(sync, content="a ballot")
        assert not isinstance((await tables_and_types(url))["bulletin"]["content"], Text)
        assert await _with_engine(url, _state) is State.LEGACY

        assert await adopt_or_upgrade(url) == head_revision()

        assert isinstance((await tables_and_types(url))["bulletin"]["content"], Text)
        assert bulletins(sync) == [("a ballot", "code")]  # nothing was lost, nothing was created twice
        assert await differences(url) == []

    async def test_a_database_made_by_this_version_is_only_stamped(self, db):
        url, sync = db
        engine = create_engine(sync)
        SQLModel.metadata.create_all(engine)
        engine.dispose()
        insert_a_bulletin(sync, content="mine")
        assert await _with_engine(url, _state) is State.LEGACY_TEXT
        assert await current_revision(url) is None

        assert await adopt_or_upgrade(url) == head_revision()

        assert bulletins(sync) == [("mine", "code")]
        assert await differences(url) == []


class TestUpgradingAndDowngrading:
    async def test_the_data_survives_the_upgrade_and_the_downgrade(self, db):
        url, sync = db
        config = alembic_config(url)
        await run(command.upgrade, config, BASELINE)
        insert_a_bulletin(sync, content="before")
        await run(command.upgrade, config, "head")
        assert await current_revision(url) == BALLOTS_ARE_TEXT
        assert bulletins(sync) == [("before", "code")]
        await run(command.downgrade, config, BASELINE)
        assert await current_revision(url) == BASELINE
        assert bulletins(sync) == [("before", "code")]
        assert not isinstance((await tables_and_types(url))["bulletin"]["content"], Text)

    async def test_the_sql_can_be_read_before_it_is_run(self, capsys):
        """`alembic upgrade --sql` against PostgreSQL: the statements are written, nothing is connected to."""
        config = alembic_config("postgresql+asyncpg://nobody:x@nowhere.invalid/none")
        await run(command.upgrade, config, f"{BASELINE}:head", sql=True)
        sql = capsys.readouterr().out
        assert "ALTER TABLE bulletin ALTER COLUMN content TYPE TEXT" in sql
        assert "ALTER TABLE vote ALTER COLUMN tally_proof TYPE TEXT" in sql
        assert "UPDATE alembic_version SET version_num='0002'" in sql


class TestTheApplicationAndTheSchema:
    async def test_it_refuses_to_run_on_a_database_that_is_behind(self, db):
        url, _ = db
        with pytest.raises(SchemaOutOfDate, match="python -m app.db.migrate"):
            await ensure_current(url)  # no history at all
        await run(command.upgrade, alembic_config(url), BASELINE)
        with pytest.raises(SchemaOutOfDate, match=f"revision {BASELINE}"):
            await ensure_current(url)
        await adopt_or_upgrade(url)
        await ensure_current(url)  # at the latest: it runs

    async def test_the_command_line_checks_without_changing_anything(self, db, monkeypatch, capsys):
        url, _ = db
        monkeypatch.setattr(migrate, "get_db_url", lambda: url)
        assert await migrate._main(["--check"]) == 1
        assert "python -m app.db.migrate" in capsys.readouterr().err
        assert not (await tables_and_types(url))
        assert await migrate._main([]) == 0
        assert await migrate._main(["--check"]) == 0
