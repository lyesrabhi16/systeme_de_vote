from pydantic import BaseModel, Field, field_validator
from enum import Enum
from dotenv import load_dotenv
import os
from app.config.globals import BASE_DIR
from typing import List


class ENV_MODES(Enum):
    DEVELOPMENT = "development"
    PRODUCTION = "production"
    TESTING = "testing"


class _ENV(BaseModel):
    ENV_MODE: ENV_MODES = Field(
        default=ENV_MODES.DEVELOPMENT,
        title="Environment Mode",
        description=f"The environment mode the application is running in. possible values are {list(ENV_MODES)}",
    )

    ALLOWED_ORIGINS: List[str] = Field(
        default=["*"],
        title="CORS Allowed origins",
        description="List of allowed origins for CORS separated by commas ','",
    )

    DB_DRIVER: str = Field(
        default="postgresql+asyncpg",
        title="Database Driver",
        description="The database driver to use for the connection",
    )
    DB_USER: str = Field(
        title="Database User",
        description="The database user for the connection",
    )
    DB_PASSWORD: str = Field(
        title="Database Password",
        description="The database password for the connection",
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
    )

    JWT_SECRET_KEY: str = Field(
        title="JWT Secret Key",
        description="The secret key used to sign JWT tokens",
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

    @field_validator("DB_PORT", mode="before")
    @classmethod
    def validate_db_port(cls, v) -> int:
        """Convert string to int for DB_PORT"""
        if isinstance(v, str):
            return int(v)
        return v

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
        raise ValueError(
            f"Invalid ENV_MODE: {v}. Must be one of {[m.value for m in ENV_MODES]}"
        )

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def validate_allowed_origins(cls, v: str) -> List[str]:
        """Convert comma-separated string to list"""
        if isinstance(v, str):
            return list(
                filter(lambda x: x != "", [origin.strip() for origin in v.split(",")])
            )
        elif isinstance(v, list):
            return v
        else:
            raise ValueError(
                "ALLOWED_ORIGINS must be a comma-separated string or a list"
            )

    @property
    def DEBUG(self) -> bool:
        """Returns True if ENV_MODE is DEVELOPMENT or TESTING, False otherwise"""
        return self.ENV_MODE in {ENV_MODES.DEVELOPMENT, ENV_MODES.TESTING}


# get env variables
env_file_path = os.path.join(BASE_DIR, ".env")
load_dotenv(env_file_path, override=False)
# public Singleton instance of env variables
env = _ENV(**os.environ)
