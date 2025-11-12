def test_env_mode():
    # set ENV_MODE to PRODUCTION
    import os

    os.environ["ENV_MODE"] = "production"

    # re-import env to pick up the new environment variable
    from app.config.env import env, ENV_MODES

    assert env.ENV_MODE in ENV_MODES
    assert isinstance(env.ENV_MODE, ENV_MODES)
    assert env.ENV_MODE == ENV_MODES.PRODUCTION


def test_allowed_origins():
    from app.config.env import env, ENV_MODES

    assert isinstance(env.ALLOWED_ORIGINS, list)
    assert all(isinstance(origin, str) for origin in env.ALLOWED_ORIGINS)
    assert env.ALLOWED_ORIGINS == ["*"]  # Assuming default is ["*"]


def test_env_mode_values():
    from app.config.env import env, ENV_MODES

    valid_modes = [mode.value for mode in ENV_MODES]
    for mode in valid_modes:
        assert mode in ["development", "production", "testing"]


def test_allowed_origins_parsing():
    from app.config.env import env, ENV_MODES

    # Test that a comma-separated string is parsed correctly
    test_env = env.model_validate(
        {"ALLOWED_ORIGINS": "http://example.com, http://localhost"}
    )
    assert test_env.ALLOWED_ORIGINS == ["http://example.com", "http://localhost"]
    # Test that a list is accepted as is
    test_env = env.model_validate(
        {"ALLOWED_ORIGINS": ["http://example.com", "http://localhost"]}
    )
    assert test_env.ALLOWED_ORIGINS == ["http://example.com", "http://localhost"]


def test_invalid_env_mode():
    from app.config.env import env, ENV_MODES

    try:
        env.model_validate({"ENV_MODE": "invalid_mode"})
        assert False, "ValidationError expected"
    except ValueError as e:
        assert "Invalid ENV_MODE" in str(e)


def test_env_mode_case_insensitive():
    from app.config.env import env, ENV_MODES

    for mode in ["DEVELOPMENT", "Development", "development"]:
        validated = env.model_validate({"ENV_MODE": mode})
        assert validated.ENV_MODE == ENV_MODES.DEVELOPMENT


def test_invalid_allowed_origins():
    from app.config.env import env, ENV_MODES

    try:
        env.model_validate({"ALLOWED_ORIGINS": 12345})
        assert False, "ValidationError expected"
    except ValueError as e:
        assert "ALLOWED_ORIGINS must be a comma-separated string or a list" in str(e)


def test_none_allowed_origins():
    from app.config.env import env, ENV_MODES

    try:
        env.model_validate({"ALLOWED_ORIGINS": None})
        assert False, "ValidationError expected"
    except ValueError as e:
        assert "ALLOWED_ORIGINS must be a comma-separated string or a list" in str(e)


def test_default_values():
    # remove all set environment variables
    import os
    from app.config.env import env, ENV_MODES, load_env

    for env_var in env.__class__.model_fields.keys():
        os.environ.pop(env_var, None)
    env = load_env()

    # Check default values
    assert env.ENV_MODE == ENV_MODES.DEVELOPMENT
    assert env.ALLOWED_ORIGINS == ["*"]
    assert env.DB_HOST == "localhost"
    assert env.DB_PORT == 5432
    assert env.HOST_URL == "http://localhost:8000"


def test_env_model_types():
    from app.config.env import env, ENV_MODES

    assert isinstance(env.ENV_MODE, ENV_MODES)
    assert isinstance(env.ALLOWED_ORIGINS, list)
    for origin in env.ALLOWED_ORIGINS:
        assert isinstance(origin, str)


def test_env_mode_str():
    from app.config.env import env, ENV_MODES

    assert str(env.ENV_MODE.value) in [mode.value for mode in ENV_MODES]


def test_allowed_origins_empty():
    from app.config.env import env, ENV_MODES

    test_env = env.model_validate({"ALLOWED_ORIGINS": ""})
    assert test_env.ALLOWED_ORIGINS == []


def test_allowed_origins_whitespace():
    from app.config.env import env, ENV_MODES

    test_env = env.model_validate(
        {"ALLOWED_ORIGINS": "   http://example.com   ,   http://localhost   "}
    )
    assert test_env.ALLOWED_ORIGINS == ["http://example.com", "http://localhost"]
