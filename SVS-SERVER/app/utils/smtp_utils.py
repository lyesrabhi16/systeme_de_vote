from typing import List
from fastapi_mail import FastMail, MessageSchema, NameEmail, MessageType

from app.config.smtp_config import smtp_config
from app.utils.template_utils import create_template_context


async def send_email(
    to_email: List[NameEmail] | List[str],
    subject: str,
    body: str | None = None,
    template: str | None = None,
    context: dict | None = None,
) -> None:
    """Send an email using SMTP."""

    _to_email: List[NameEmail] = []
    for recipient in to_email:
        if isinstance(recipient, str):
            _to_email.append(NameEmail(email=recipient, name=""))
        else:
            _to_email.append(recipient)

    message = MessageSchema(
        subject=subject,
        recipients=_to_email,
        body=body if not template else None,
        subtype=MessageType.html,
        template_body=(
            create_template_context(context) if template and context else None
        ),
    )

    fm = FastMail(smtp_config)
    await fm.send_message(
        message,
        template_name=template if template else None,
    )


async def send_connection_otp_email(
    to_email: List[NameEmail] | List[str],
    otp_code: str,
):
    """Send a connection OTP email."""

    return await send_email(
        to_email=to_email,
        subject="Votre code de connexion",
        template="send_OTP.html",
        context={"OTP_CODE": otp_code},
    )
