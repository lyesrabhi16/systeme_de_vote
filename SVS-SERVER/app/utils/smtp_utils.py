import inspect
from typing import Callable, List
from fastapi_mail import FastMail, MessageSchema, NameEmail, MessageType

from app.config.smtp_config import smtp_config
from app.utils.template_utils import create_template_context
from loguru import logger


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


def send_in_thread(func: Callable | None = None) -> Callable:
    """send email in a separate thread."""
    import threading

    logger.debug("Preparing to send email in thread")

    def wrapper(*args, **kwargs):
        logger.debug("Starting email thread")

        def _func(*args, **kwargs):
            if inspect.iscoroutinefunction(func):
                import asyncio

                asyncio.run(func(*args, **kwargs))
            elif callable(func):
                func(*args, **kwargs)

        thread = threading.Thread(target=_func, args=args, kwargs=kwargs)
        thread.start()
        logger.debug("Email thread started")
        return thread

    return wrapper


async def send_vote_cast_confirmation_email(
    to_email: List[NameEmail] | List[str],
    vote_title: str,
    vote_id: int,
    vote_content: str,
    unique_code: str,
):
    """Send a vote cast confirmation email."""
    logger.debug(
        f"Sending vote cast confirmation email to {to_email} for vote: {vote_title}"
    )
    return await send_email(
        to_email=to_email,
        subject="Confirmation de votre vote",
        template="vote_cast_confirmation.html",
        context={
            "VOTE_TITLE": vote_title,
            "VOTE_ID": vote_id,
            "VOTE_CONTENT": vote_content,
            "UNIQUE_CODE": unique_code,
        },
    )


async def send_connection_otp_email(
    to_email: List[NameEmail] | List[str],
    otp_code: str,
):
    """Send a connection OTP email."""
    logger.debug(f"Sending connection OTP email to {to_email} with OTP: {otp_code}")
    return await send_email(
        to_email=to_email,
        subject="Votre code de connexion",
        template="send_OTP.html",
        context={"OTP_CODE": otp_code},
    )


async def send_password_reset_email(
    to_email: List[NameEmail] | List[str],
    url: str,
):
    """Send a password reset OTP email."""
    logger.debug(f"Sending password reset email to {to_email} with URL: {url}")
    return await send_email(
        to_email=to_email,
        subject="Réinitialisation de votre mot de passe",
        template="password_reset_OTP.html",
        context={"URL": url},
    )
