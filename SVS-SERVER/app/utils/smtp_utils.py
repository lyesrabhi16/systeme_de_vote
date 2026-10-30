import inspect
from collections.abc import Callable

from fastapi_mail import FastMail, MessageSchema, MessageType, NameEmail
from loguru import logger

from app.config.env import env
from app.config.smtp_config import smtp_config
from app.utils.template_utils import create_template_context


async def send_email(
    to_email: list[NameEmail] | list[str],
    subject: str,
    body: str | None = None,
    template: str | None = None,
    context: dict | None = None,
) -> None:
    """
    Send an email using SMTP.
    Without SMTP_HOST (never accepted in production) nothing is sent: the email is written to the log, so that the project can be tried
    on a machine with no mail server. That is the only place where a one-time password is ever logged.
    """
    if not env.SMTP_HOST:
        logger.warning(f"[no SMTP_HOST: email not sent] to={to_email} subject={subject!r} content={context or body}")
        return

    _to_email: list[NameEmail] = []
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
        template_body=(create_template_context(context) if template and context else None),
    )

    fm = FastMail(smtp_config)
    await fm.send_message(
        message,
        template_name=template if template else None,
    )


def send_in_thread(func: Callable | None = None) -> Callable:
    """send email in a separate thread."""
    import threading

    def wrapper(*args, **kwargs):
        def _func(*args, **kwargs):
            try:
                if inspect.iscoroutinefunction(func):
                    import asyncio

                    asyncio.run(func(*args, **kwargs))
                elif callable(func):
                    func(*args, **kwargs)
            except Exception:
                logger.exception("The email could not be sent")

        thread = threading.Thread(target=_func, args=args, kwargs=kwargs)
        thread.start()
        return thread

    return wrapper


async def send_vote_cast_confirmation_email(
    to_email: list[NameEmail] | list[str],
    vote_title: str,
    vote_id: int,
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
            "UNIQUE_CODE": unique_code,
        },
    )


async def send_connection_otp_email(
    to_email: list[NameEmail] | list[str],
    otp_code: str,
):
    """Send a connection OTP email."""
    return await send_email(
        to_email=to_email,
        subject="Votre code de connexion",
        template="send_OTP.html",
        context={"OTP_CODE": otp_code},
    )


async def send_password_reset_email(
    to_email: list[NameEmail] | list[str],
    url: str,
):
    """Send a password reset OTP email."""
    return await send_email(
        to_email=to_email,
        subject="Réinitialisation de votre mot de passe",
        template="password_reset_OTP.html",
        context={"URL": url},
    )
