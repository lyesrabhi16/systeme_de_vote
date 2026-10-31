"""
The tests run the real application against a SQLite file and an in-memory Redis (fakeredis): no PostgreSQL, no Redis, no mail server.
The environment is set before anything of `app` is imported, because the database engine and the keys are made at import time.
"""

import os
import tempfile

_TMP = tempfile.mkdtemp(prefix="svs-tests-")
os.environ.update(
    {
        "ENV_MODE": "testing",
        "DB_DRIVER": "sqlite+aiosqlite",
        "DB_NAME": os.path.join(_TMP, "test.db"),
        "SMTP_HOST": "",  # no mail is ever sent
        "ALLOWED_ORIGINS": "http://localhost:3000",
        "PAILLIER_KEY_BITS": "1024",  # keeps the key generation of each test election fast; production refuses less than 2048
    }
)
# the secrets are not set: in testing mode they are made up for the process, which is what is being relied on
for _name in ("JWT_SECRET_KEY", "ENCRYPTION_KEY"):
    os.environ.pop(_name, None)

from typing import Any  # noqa: E402

import fakeredis  # noqa: E402
import pytest  # noqa: E402
import pytest_asyncio  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402

import app.db.db as db_module  # noqa: E402
from app.db import init_db  # noqa: E402
from app.main import APP  # noqa: E402
from app.utils import smtp_utils  # noqa: E402

_OUTBOX: list[dict[str, Any]] = []


@pytest_asyncio.fixture(autouse=True)
async def fresh_state(monkeypatch):
    """An empty database and an empty cache for every test, and the emails kept where a test can read them."""
    cache = fakeredis.FakeAsyncRedis(decode_responses=True)
    monkeypatch.setattr(db_module, "cache_db", cache)
    await init_db(recreate=True)

    _OUTBOX.clear()

    def fake_send_in_thread(func=None):
        def run(*args, **kwargs):
            _OUTBOX.append({"function": getattr(func, "__name__", ""), **kwargs})

        return run

    monkeypatch.setattr(smtp_utils, "send_in_thread", fake_send_in_thread)
    yield
    await cache.flushall()
    await cache.aclose()
    await db_module.engine.dispose()


@pytest.fixture
def outbox() -> list[dict[str, Any]]:
    """The emails the application tried to send (the one-time passwords, the reset links)."""
    return _OUTBOX


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=APP), base_url="http://test") as c:
        yield c
