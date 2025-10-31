from pydantic import BaseModel, Field, field_validator
from enum import Enum
from dotenv import load_dotenv
import os
from app.config.globals import BASE_DIR


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

    @field_validator("ENV_MODE", mode="before")
    @classmethod
    def validate_env_mode(cls, v: str) -> ENV_MODES:
        """Convert string values to ENV_MODES enum"""
        # Try to match by value
        for mode in ENV_MODES:
            if mode.value == v.lower():
                return mode
        raise ValueError(
            f"Invalid ENV_MODE: {v}. Must be one of {[m.value for m in ENV_MODES]}"
        )


# get env variables
load_dotenv(BASE_DIR, override=True)
# public Singleton instance of env variables
env = _ENV(**os.environ)
