import pytest
from cryptography.fernet import Fernet
from pydantic import ValidationError

from app.config.env import _ENV, ENV_MODES


def production(**overrides):
    """A configuration that production accepts."""
    return {
        "ENV_MODE": "production",
        "JWT_SECRET_KEY": "j" * 40,
        "ENCRYPTION_KEY": Fernet.generate_key().decode(),
        "ALLOWED_ORIGINS": "https://vote.example.org",
        "SMTP_HOST": "smtp.example.org",
        "SMTP_SENDER_EMAIL": "vote@example.org",
        **overrides,
    }


class TestProduction:
    def test_accepts_a_complete_configuration(self):
        env = _ENV(**production())
        assert env.ENV_MODE == ENV_MODES.PRODUCTION
        assert env.generated_secrets == []

    @pytest.mark.parametrize(
        "overrides, mentions",
        [
            ({"JWT_SECRET_KEY": ""}, "JWT_SECRET_KEY is not set"),
            ({"JWT_SECRET_KEY": "your_secret_key"}, "JWT_SECRET_KEY is not set"),
            ({"JWT_SECRET_KEY": "short-jwt-secret-9"}, "JWT_SECRET_KEY is too short"),
            ({"ENCRYPTION_KEY": ""}, "ENCRYPTION_KEY is not set"),
            ({"ENCRYPTION_KEY": "your_encryption_key_32_bytes!"}, "ENCRYPTION_KEY is not set"),
            ({"ENCRYPTION_KEY": "not a fernet key"}, "ENCRYPTION_KEY is not a Fernet key"),
            ({"ALLOWED_ORIGINS": "*"}, "ALLOWED_ORIGINS"),
            ({"ALLOWED_ORIGINS": "https://a.example, *"}, "ALLOWED_ORIGINS"),
            ({"ALLOWED_ORIGINS": ""}, "ALLOWED_ORIGINS"),
            ({"SMTP_HOST": ""}, "SMTP_HOST is not set"),
            ({"SMTP_SENDER_EMAIL": ""}, "SMTP_SENDER_EMAIL is not set"),
        ],
    )
    def test_refuses_what_would_leave_it_unprotected(self, overrides, mentions):
        with pytest.raises(ValidationError, match=mentions):
            _ENV(**production(**overrides))

    def test_refuses_an_election_key_that_is_too_small_to_protect_anything(self):
        with pytest.raises(ValidationError, match="PAILLIER_KEY_BITS must be at least 2048"):
            _ENV(**production(PAILLIER_KEY_BITS=1024))
        assert _ENV(**production(PAILLIER_KEY_BITS=3072)).PAILLIER_KEY_BITS == 3072

    def test_says_everything_that_is_wrong_at_once(self):
        with pytest.raises(ValidationError) as error:
            _ENV(ENV_MODE="production")
        for expected in ("JWT_SECRET_KEY", "ENCRYPTION_KEY", "ALLOWED_ORIGINS", "SMTP_HOST"):
            assert expected in str(error.value)


class TestWhatAnErrorSays:
    def test_it_never_prints_the_values_it_was_given(self):
        """The input of a failed validation is the whole environment: it must not end up in the log."""
        secrets = {
            "DB_PASSWORD": "db-secret-value-1",
            "SMTP_PASSWORD": "smtp-secret-value-2",
            "REDIS_PASSWORD": "redis-secret-value-3",
            "JWT_SECRET_KEY": "short-jwt-secret-9",
        }
        with pytest.raises(ValidationError) as error:
            _ENV(ENV_MODE="production", **secrets)
        text = str(error.value)
        assert "JWT_SECRET_KEY is too short" in text  # what is wrong is said
        for value in secrets.values():
            assert value not in text  # what was given is not

    def test_nor_does_the_error_of_a_field(self):
        with pytest.raises(ValidationError) as error:
            _ENV(ENV_MODE="staging", DB_PASSWORD="db-secret-value-1")
        assert "db-secret-value-1" not in str(error.value)


class TestOutsideProduction:
    @pytest.mark.parametrize("mode", ["development", "testing"])
    def test_makes_up_the_secrets_that_are_missing_and_says_which(self, mode):
        env = _ENV(ENV_MODE=mode)
        assert env.generated_secrets == ["JWT_SECRET_KEY", "ENCRYPTION_KEY"]
        assert len(env.JWT_SECRET_KEY) >= 32
        Fernet(env.ENCRYPTION_KEY)

    def test_never_makes_the_same_secrets_twice(self):
        one, two = _ENV(), _ENV()
        assert one.JWT_SECRET_KEY != two.JWT_SECRET_KEY
        assert one.ENCRYPTION_KEY != two.ENCRYPTION_KEY

    def test_replaces_the_values_of_the_examples(self):
        env = _ENV(JWT_SECRET_KEY="your_secret_key", ENCRYPTION_KEY="your_encryption_key_32_bytes!")
        assert env.JWT_SECRET_KEY != "your_secret_key"
        assert "JWT_SECRET_KEY" in env.generated_secrets

    def test_keeps_the_secrets_it_is_given(self):
        key = Fernet.generate_key().decode()
        env = _ENV(JWT_SECRET_KEY="mine", ENCRYPTION_KEY=key)
        assert env.JWT_SECRET_KEY == "mine"
        assert env.ENCRYPTION_KEY == key
        assert env.generated_secrets == []

    def test_still_refuses_a_key_that_cannot_work(self):
        with pytest.raises(ValidationError, match="not a Fernet key"):
            _ENV(ENCRYPTION_KEY="nope")

    def test_does_not_allow_every_origin_by_default(self):
        origins = _ENV().ALLOWED_ORIGINS
        assert origins and "*" not in origins
        assert all(origin.startswith("http://localhost") for origin in origins)


class TestParsing:
    def test_env_mode_is_read_in_any_case(self):
        for text in ("DEVELOPMENT", "Development", "development"):
            assert _ENV(ENV_MODE=text).ENV_MODE == ENV_MODES.DEVELOPMENT

    def test_an_unknown_env_mode_is_refused(self):
        with pytest.raises(ValidationError, match="Invalid ENV_MODE"):
            _ENV(ENV_MODE="staging")

    def test_origins_come_from_a_list_or_a_comma_separated_text(self):
        assert _ENV(ALLOWED_ORIGINS="http://a.example, http://b.example").ALLOWED_ORIGINS == [
            "http://a.example",
            "http://b.example",
        ]
        assert _ENV(ALLOWED_ORIGINS=["http://a.example"]).ALLOWED_ORIGINS == ["http://a.example"]
        assert _ENV.validate_allowed_origins("") == []
        assert _ENV(ALLOWED_ORIGINS="   http://a.example   ,   ").ALLOWED_ORIGINS == ["http://a.example"]

    @pytest.mark.parametrize("bad", [12345, None])
    def test_origins_that_are_neither_are_refused(self, bad):
        with pytest.raises(ValidationError, match="comma-separated string or a list"):
            _ENV(ALLOWED_ORIGINS=bad)

    def test_the_port_may_be_text(self):
        assert _ENV(DB_PORT="6543").DB_PORT == 6543

    def test_debug_is_for_development_and_testing(self):
        assert _ENV(ENV_MODE="development").DEBUG
        assert _ENV(ENV_MODE="testing").DEBUG
        assert not _ENV(**production()).DEBUG
