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
