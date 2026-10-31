import os
import secrets
from enum import Enum

from cryptography.fernet import Fernet
from dotenv import load_dotenv
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.config.globals import BASE_DIR


class ENV_MODES(Enum):
    DEVELOPMENT = "development"
    PRODUCTION = "production"
    TESTING = "testing"


# Values that must never protect anything (they appear in the examples and in older versions of this project).
_PLACEHOLDERS = {
    "",
    "your_secret_key",
    "your_jwt_secret_key",
    "your_encryption_key_32_bytes!",
    "changeme",
    "secret",
}

JWT_SECRET_MIN_LENGTH = 32

# the web client's servers while developing (Vite, or the built client served by the API)
DEVELOPMENT_ORIGINS = ["http://localhost:3000", "http://localhost:5173", "http://localhost:8000"]


def _is_fernet_key(value: str) -> bool:
    try:
        Fernet(value)
        return True
    except (ValueError, TypeError):
        return False


class _ENV(BaseModel):
    # An error would otherwise print its input, which is the whole environment: every secret, in the log of a container that failed to start.
    model_config = ConfigDict(hide_input_in_errors=True)

    ENV_MODE: ENV_MODES = Field(
        default=ENV_MODES.DEVELOPMENT,
        title="Environment Mode",
        description=f"The environment mode the application is running in. possible values are {list(ENV_MODES)}",
    )

    ALLOWED_ORIGINS: list[str] = Field(
        default=[],
        title="CORS Allowed origins",
        description="List of allowed origins for CORS separated by commas ','. Required in production, and never a wildcard there, because cookies are sent with the requests. Empty, outside production, it is the local development servers.",
    )

    DB_DRIVER: str = Field(
        default="postgresql+asyncpg",
        title="Database Driver",
        description="The database driver to use for the connection",
    )
    DB_USER: str = Field(
        title="Database User",
        description="The database user for the connection",
        default="",
    )
    DB_PASSWORD: str = Field(
        title="Database Password",
        description="The database password for the connection",
        default="",
    )
    DB_HOST: str = Field(
        default="localhost",
        title="Database Host",
        description="The database host for the connection",
    )
    DB_PORT: int = Field(
        default=5432,
        title="Database Port",
        description="The database port for the connection",
    )
    DB_NAME: str = Field(
        title="Database Name",
        description="The database name for the connection",
        default="",
    )

    JWT_SECRET_KEY: str = Field(
        title="JWT Secret Key",
        description=f"The secret key used to sign JWT tokens (at least {JWT_SECRET_MIN_LENGTH} characters in production). Generated for the process when empty, outside production.",
        default="",
    )
    JWT_ALGORITHM: str = Field(
        default="HS256",
        title="JWT Algorithm",
        description="The algorithm used to sign JWT tokens",
    )
    JWT_EXPIRATION: int = Field(
        default=3600,
        title="JWT Expiration Time",
        description="The expiration time for JWT tokens in seconds",
    )

    HOST_URL: str = Field(
        default="http://localhost:8000",
        title="Host URL",
        description="The base URL of the host where the application is running",
    )

    REDIS_HOST: str = Field(
        default="localhost",
        title="Redis Host",
        description="The Redis server host",
    )
    REDIS_PORT: int = Field(
        default=6379,
        title="Redis Port",
        description="The Redis server port",
    )
    REDIS_DB: int = Field(
        default=0,
        title="Redis Database",
        description="The Redis database number",
    )
    REDIS_USER: str = Field(
        default="",
        title="Redis User",
        description="The Redis username if applicable",
    )
    REDIS_PASSWORD: str = Field(
        default="",
        title="Redis Password",
        description="The Redis password if applicable",
    )
    OTP_EXPIRATION: int = Field(
        default=300,
        title="OTP Expiration Time",
        description="The expiration time for one-time passwords (OTP) in seconds",
    )

    SMTP_USER: str = Field(
        title="SMTP Username",
        description="The username for the SMTP server",
        default="",
    )
    SMTP_PASSWORD: str = Field(
        title="SMTP Password",
        description="The password for the SMTP server",
        default="",
    )
    SMTP_HOST: str = Field(
        title="SMTP Host",
        description="The SMTP server address. Empty, outside production, the emails are written to the log instead of being sent.",
        default="",
    )
    SMTP_PORT: int = Field(
        default=587,
        title="SMTP Port",
        description="The SMTP server port",
    )
    SMTP_USE_TLS: bool = Field(
        default=True,
        title="SMTP Use TLS",
        description="Whether to use TLS for the SMTP connection",
    )
    SMTP_STARTTLS: bool = Field(
        default=True,
        title="SMTP Use STARTTLS",
        description="Whether to use STARTTLS for the SMTP connection",
    )
    SMTP_SENDER_EMAIL: str = Field(
        title="SMTP Email",
        description="The email address to use as the sender for SMTP",
        default="",
    )

    APP_NAME: str = Field(
        default="SVS",
        title="Application Name",
        description="The name of the application",
    )

    ENCRYPTION_KEY: str = Field(
        title="Encryption Key",
        description="A Fernet key. It encrypts the private key of each election (kept in the database) and what is kept in the cache for a few minutes (the email behind a login step). Lose it and the elections can no longer be counted. Generated for the process when empty, outside production (the elections made before a restart can then no longer be counted).",
        default="",
    )
    PAILLIER_KEY_BITS: int = Field(
        default=2048,
        title="Election key size",
        description="Size in bits of the Paillier modulus of each election. Below 2048 is only for tests.",
    )

    AUTO_MIGRATE: bool | None = Field(
        default=None,
        title="Migrate when starting",
        description="Whether the application brings the database to its schema (Alembic) when it starts. Empty: yes outside production, no in production, where `python -m app.db.migrate` runs once per deployment before the application starts, and the application refuses to start on a database that is behind.",
    )

    FRONTEND_URL: str = Field(
        default="http://localhost:5173",
        title="Frontend URL",
        description="The base URL of the frontend application",
    )

    # not read from the environment: what was made up for this process because it was not given (outside production)
    generated_secrets: list[str] = Field(default_factory=list, exclude=True)

    @field_validator("DB_PORT", mode="before")
    @classmethod
    def validate_db_port(cls, v) -> int:
        """Convert string to int for DB_PORT"""
        return int(v) if isinstance(v, str) else v

    @field_validator("ENV_MODE", mode="before")
    @classmethod
    def validate_env_mode(cls, v) -> ENV_MODES:
        """Convert string values to ENV_MODES enum"""
        if isinstance(v, ENV_MODES):
            return v
        # Try to match by value
        for mode in ENV_MODES:
            if isinstance(v, str) and mode.value == v.lower():
                return mode
        raise ValueError(f"Invalid ENV_MODE: {v}. Must be one of {[m.value for m in ENV_MODES]}")

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def validate_allowed_origins(cls, v: str) -> list[str]:
        """Convert comma-separated string to list"""
        if isinstance(v, str):
            return list(filter(lambda x: x != "", [origin.strip() for origin in v.split(",")]))
        elif isinstance(v, list):
            return v
        else:
            raise ValueError("ALLOWED_ORIGINS must be a comma-separated string or a list")

    @model_validator(mode="after")
    def check_secrets(self) -> "_ENV":
        """
        In production, refuse to start with a missing or placeholder secret, or with a wildcard CORS origin.
        Elsewhere, make up the secrets that were not given (so that nothing runs on a known value), and remember which.
        """
        production = self.ENV_MODE == ENV_MODES.PRODUCTION
        problems: list[str] = []
        if not production and not self.ALLOWED_ORIGINS:
            self.ALLOWED_ORIGINS = list(DEVELOPMENT_ORIGINS)

        def check_fernet(name: str) -> None:
            value = getattr(self, name)
            if value.strip() in _PLACEHOLDERS:
                if production:
                    problems.append(f"{name} is not set")
                else:
                    setattr(self, name, Fernet.generate_key().decode())
                    self.generated_secrets.append(name)
            elif not _is_fernet_key(value):
                problems.append(
                    f"{name} is not a Fernet key (generate one with: python -c 'from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())')"
                )

        if self.JWT_SECRET_KEY.strip() in _PLACEHOLDERS:
            if production:
                problems.append("JWT_SECRET_KEY is not set")
            else:
                self.JWT_SECRET_KEY = secrets.token_urlsafe(48)
                self.generated_secrets.append("JWT_SECRET_KEY")
        elif production and len(self.JWT_SECRET_KEY) < JWT_SECRET_MIN_LENGTH:
            problems.append(f"JWT_SECRET_KEY is too short (at least {JWT_SECRET_MIN_LENGTH} characters)")

        check_fernet("ENCRYPTION_KEY")
        if production and self.PAILLIER_KEY_BITS < 2048:
            problems.append("PAILLIER_KEY_BITS must be at least 2048 in production")

        if production and not self.SMTP_HOST:
            problems.append("SMTP_HOST is not set (the one-time passwords are sent by email)")
        if production and not self.SMTP_SENDER_EMAIL:
            problems.append("SMTP_SENDER_EMAIL is not set")

        if production and ("*" in self.ALLOWED_ORIGINS or not self.ALLOWED_ORIGINS):
            problems.append(
                "ALLOWED_ORIGINS must list the origins of the web application (a wildcard is not accepted: cookies are sent with the requests)"
            )

        if problems:
            raise ValueError("Unsafe or incomplete configuration: " + "; ".join(problems))
        return self

    @property
    def auto_migrate(self) -> bool:
        return self.AUTO_MIGRATE if self.AUTO_MIGRATE is not None else self.ENV_MODE != ENV_MODES.PRODUCTION

    @property
    def DEBUG(self) -> bool:
        """Returns True if ENV_MODE is DEVELOPMENT or TESTING, False otherwise"""
        return self.ENV_MODE in {ENV_MODES.DEVELOPMENT, ENV_MODES.TESTING}


def load_env() -> _ENV:
    """load environment variables from .env file and os.environ"""
    # get env variables
    env_file_path = os.path.join(BASE_DIR, ".env")
    load_dotenv(env_file_path, override=False)
    return _ENV(**os.environ)


# public Singleton instance of env variables
env = load_env()
