import os

from fastapi_mail import ConnectionConfig
from pydantic import SecretStr

from app.config.env import _ENV, env
from app.config.globals import BASE_DIR


def make_smtp_config(settings: _ENV) -> ConnectionConfig:
    return ConnectionConfig(
        TEMPLATE_FOLDER=os.path.join(BASE_DIR, "app", "assets", "templates"),
        MAIL_USERNAME=settings.SMTP_USER,
        MAIL_PASSWORD=SecretStr(settings.SMTP_PASSWORD),
        # a mail catcher (Mailpit) takes mail without signing in, and refuses a sign-in: no user, no sign-in
        USE_CREDENTIALS=bool(settings.SMTP_USER),
        # only ever used with an SMTP_HOST, which production requires a sender for
        MAIL_FROM=settings.SMTP_SENDER_EMAIL or "svs@example.org",
        MAIL_PORT=settings.SMTP_PORT,
        MAIL_SERVER=settings.SMTP_HOST,
        MAIL_SSL_TLS=settings.SMTP_USE_TLS,
        MAIL_STARTTLS=(False if settings.SMTP_USE_TLS else settings.SMTP_STARTTLS),  # Avoid conflict if both are True
        # only matters with TLS: a development server (or a catcher) may have a certificate of its own making
        VALIDATE_CERTS=not settings.DEBUG,
    )


smtp_config: ConnectionConfig = make_smtp_config(env)
