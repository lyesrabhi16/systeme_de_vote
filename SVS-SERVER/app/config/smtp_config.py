import os
from fastapi_mail import ConnectionConfig
from pydantic import SecretStr

from app.config.env import env
from app.config.globals import BASE_DIR

smtp_config: ConnectionConfig = ConnectionConfig(
    TEMPLATE_FOLDER=os.path.join(BASE_DIR, "app", "assets", "templates"),
    MAIL_USERNAME=env.SMTP_USER,
    MAIL_PASSWORD=SecretStr(env.SMTP_PASSWORD),
    MAIL_FROM=env.SMTP_SENDER_EMAIL or "svs@example.org",  # only ever used with an SMTP_HOST, which production requires a sender for
    MAIL_PORT=env.SMTP_PORT,
    MAIL_SERVER=env.SMTP_HOST,
    MAIL_SSL_TLS=env.SMTP_USE_TLS,
    MAIL_STARTTLS=(
        False if env.SMTP_USE_TLS else env.SMTP_STARTTLS
    ),  # Avoid conflict if both are True
)
