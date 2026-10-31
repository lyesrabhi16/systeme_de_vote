"""How the application talks to a mail server: with a real one it signs in, with a mail catcher (Mailpit) it does not."""

from app.config.env import _ENV
from app.config.smtp_config import make_smtp_config


def settings(**overrides):
    return _ENV(
        **{
            "ENV_MODE": "development",
            "SMTP_HOST": "smtp.example.org",
            "SMTP_SENDER_EMAIL": "svs@example.org",
            **overrides,
        }
    )


def test_a_mail_catcher_without_a_user_is_not_signed_in_to():
    config = make_smtp_config(settings(SMTP_HOST="mailpit", SMTP_PORT=1025, SMTP_USE_TLS=False, SMTP_STARTTLS=False))
    assert config.MAIL_SERVER == "mailpit" and config.MAIL_PORT == 1025
    assert not config.USE_CREDENTIALS  # Mailpit does not offer AUTH: a sign-in would be refused
    assert not config.MAIL_STARTTLS and not config.MAIL_SSL_TLS


def test_a_real_server_with_a_user_is_signed_in_to():
    config = make_smtp_config(
        settings(SMTP_USER="mailer", SMTP_PASSWORD="secret", SMTP_USE_TLS=False, SMTP_STARTTLS=True)
    )
    assert config.USE_CREDENTIALS and config.MAIL_USERNAME == "mailer"
    assert config.MAIL_STARTTLS


def test_tls_and_starttls_are_not_both_asked_for():
    config = make_smtp_config(settings(SMTP_USER="mailer", SMTP_USE_TLS=True, SMTP_STARTTLS=True))
    assert config.MAIL_SSL_TLS and not config.MAIL_STARTTLS


def test_certificates_are_checked_in_production_and_not_necessarily_elsewhere():
    from cryptography.fernet import Fernet

    production = _ENV(
        ENV_MODE="production",
        JWT_SECRET_KEY="j" * 40,
        ENCRYPTION_KEY=Fernet.generate_key().decode(),
        ALLOWED_ORIGINS="https://vote.example.org",
        SMTP_HOST="smtp.example.org",
        SMTP_SENDER_EMAIL="svs@example.org",
        SMTP_USER="mailer",
    )
    assert make_smtp_config(production).VALIDATE_CERTS
    assert not make_smtp_config(settings()).VALIDATE_CERTS
