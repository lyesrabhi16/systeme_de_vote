from fastapi import APIRouter, Depends, HTTPException, Request, Response
from loguru import logger

from app.config.env import ENV_MODES, env
from app.middlewares.auth_middleware import AUTH_MIDDLEWARE
from app.models import response_models
from app.models.auth_models import (
    JWT_DATA,
    OTPResendRequestModel,
    OTPVerificationModel,
    PasswordResetOTPModel,
    PasswordResetRequestModel,
    TokenInput,
    TokenResponse,
)
from app.models.error_codes import ERROR_CODES
from app.models.messages import Messages
from app.models.user import (
    CurrentUserResponseModel,
    SuccessfulUserLoginResponseModel,
    User,
)
from app.models.user_login_model import UserLoginModel
from app.utils import auth_utils, rate_limit, smtp_utils

router = APIRouter()

WINDOW = 15 * 60  # seconds: how long a failure is remembered
LOGIN_FAILURES = 5  # per account, in the window
LOGIN_FAILURES_PER_ADDRESS = 30
OTP_FAILURES_PER_ADDRESS = 20
EMAILS_PER_ACCOUNT = 3  # one-time passwords or reset links a person can ask for, in the window
EMAILS_PER_ADDRESS = 10


@router.post(
    "/login",
    response_model=SuccessfulUserLoginResponseModel,
    dependencies=[Depends(AUTH_MIDDLEWARE.RequireUnauthenticated)],
    operation_id="login",
)
async def login(data: UserLoginModel, request: Request, response: Response):
    await rate_limit.ensure_below(request, "login", data.identifier, LOGIN_FAILURES, LOGIN_FAILURES_PER_ADDRESS)
    # check credentials
    user = await UserLoginModel.authenticate(
        identifier=data.identifier,
        password=data.password,
        identifier_type=data.identifier_type,
    )
    if not user or user.id is None:
        await rate_limit.count_attempt(request, "login", data.identifier, WINDOW)
        raise HTTPException(status_code=401, detail=ERROR_CODES.INVALID_CREDENTIALS)
    # generate OTP
    otp = await auth_utils.create_otp(user.id)

    # send OTP via email
    smtp_utils.send_in_thread(smtp_utils.send_connection_otp_email)(
        to_email=[user.email],
        otp_code=otp,
    )

    return await SuccessfulUserLoginResponseModel.from_user(user)


@router.post(
    "/verify-otp",
    response_model=TokenResponse,
    dependencies=[Depends(AUTH_MIDDLEWARE.RequireUnauthenticated)],
    operation_id="verifyOTP",
)
async def verify_otp(data: OTPVerificationModel, request: Request, response: Response):
    await rate_limit.ensure_below(request, "otp", None, 0, OTP_FAILURES_PER_ADDRESS)
    user_email = auth_utils.decrypt_string(await auth_utils.retrieve_string_from_temp_url_safe_string(data.id))
    user = await UserLoginModel.get_user_by_email(user_email)
    if not user or user.id is None:
        raise HTTPException(status_code=404, detail=ERROR_CODES.USER_NOT_FOUND)
    try:
        verified = await auth_utils.verify_otp(user.id, data.otp)
    except HTTPException:
        await rate_limit.count_attempt(request, "otp", None, WINDOW)
        raise
    if not verified:
        await rate_limit.count_attempt(request, "otp", None, WINDOW)
        raise HTTPException(status_code=401, detail=ERROR_CODES.INVALID_OTP)

    # generate token
    if not user.is_active:
        raise HTTPException(status_code=403, detail=ERROR_CODES.FORBIDDEN)
    token = auth_utils.generate_token(
        JWT_DATA(id=user.id),
        expires_in=env.JWT_EXPIRATION if data.remember_me else env.JWT_EXPIRATION // 2,
    )
    response.set_cookie(
        key="token",
        value=token,
        httponly=True,
        secure=True if env.ENV_MODE == ENV_MODES.PRODUCTION else False,
        samesite="strict" if env.ENV_MODE == ENV_MODES.PRODUCTION else "lax",
        max_age=env.JWT_EXPIRATION if data.remember_me else None,
    )
    if not user.verified_email:
        user.verified_email = True
        await user.save()
    return TokenResponse(token=token)


@router.post(
    "/resend-otp",
    response_model=response_models.MessageResponse,
    dependencies=[Depends(AUTH_MIDDLEWARE.RequireUnauthenticated)],
    operation_id="resend_otp",
)
async def resend_otp(data: OTPResendRequestModel, request: Request):
    """Resend OTP to user email"""
    user_email = auth_utils.decrypt_string(await auth_utils.retrieve_string_from_temp_url_safe_string(data.id))
    await rate_limit.ensure_below(request, "resend", user_email, EMAILS_PER_ACCOUNT, EMAILS_PER_ADDRESS)
    user: User | None = await UserLoginModel.get_user_by_email(user_email)
    if user is None:
        raise HTTPException(status_code=404, detail=ERROR_CODES.USER_NOT_FOUND)
    if user.id is None:
        raise HTTPException(status_code=500, detail=ERROR_CODES.INTERNAL_SERVER_ERROR)
    await rate_limit.count_attempt(request, "resend", user_email, WINDOW)
    # destroy previous OTPs
    await auth_utils.remove_otp(user.id)
    # create new OTP and re-send email
    otp = await auth_utils.create_otp(user.id)
    smtp_utils.send_in_thread(smtp_utils.send_connection_otp_email)(
        to_email=[user.email],
        otp_code=otp,
    )
    return response_models.MessageResponse(message=Messages.OTP_RESENT_SUCCESS)


@router.post(
    "/logout",
    response_model=response_models.MessageResponse,
    operation_id="logout",
)
async def logout(response: Response):
    response.delete_cookie("token")
    return response_models.MessageResponse(message=Messages.LOGOUT_SUCCESS)


@router.post(
    "/user/me",
    response_model=CurrentUserResponseModel,
    dependencies=[Depends(AUTH_MIDDLEWARE.RequireAuthenticated)],
    operation_id="get_current_user",
)
async def get_current_user(request: Request, data: TokenInput | None = None):
    """Get the current user information"""

    token = (
        data.token if data and data.token else request.state.token
    )  # the one in the body, else the cookie or the header
    user: User | None = await UserLoginModel.get_current_user(token)
    if user is None:
        raise HTTPException(status_code=404, detail=ERROR_CODES.USER_NOT_FOUND)
    if user.is_active is False:
        raise HTTPException(status_code=403, detail=ERROR_CODES.FORBIDDEN)
    return CurrentUserResponseModel.from_user(user)


@router.post(
    "/password-reset",
    operation_id="password_reset_request",
    response_model=response_models.MessageResponse,
)
async def password_reset_request(data: PasswordResetRequestModel, request: Request):
    """
    Request password reset by sending OTP to user email.
    The answer is the same whether the address belongs to somebody or not, so that it cannot be used to find out who has an account.
    """
    user_email = data.email
    await rate_limit.ensure_below(request, "reset", user_email, EMAILS_PER_ACCOUNT, EMAILS_PER_ADDRESS)
    await rate_limit.count_attempt(request, "reset", user_email, WINDOW)
    user: User | None = await UserLoginModel.get_user_by_email(user_email)
    if user is not None and user.id is not None:
        # destroy previous OTPs
        await auth_utils.remove_otp(user.id, "reset")
        # create new OTP and send the email
        otp = await auth_utils.create_otp(user.id, "reset")
        encrypted_email = auth_utils.encrypt_string(user.email)

        url = f"{env.FRONTEND_URL}/reset-password?uid={await auth_utils.generate_temp_url_safe_string(encrypted_email)}&otp={otp}"
        smtp_utils.send_in_thread(smtp_utils.send_password_reset_email)(
            to_email=[user.email],
            url=url,
        )
    return response_models.MessageResponse(message=Messages.PASSWORD_RESET_EMAIL_SENT)


@router.post(
    "/password-reset/validate",
    response_model=response_models.MessageResponse,
    operation_id="validate_password_reset",
)
async def validate_password_reset_otp(data: PasswordResetOTPModel, request: Request, response: Response):
    await rate_limit.ensure_below(request, "otp", None, 0, OTP_FAILURES_PER_ADDRESS)
    url_safe_string = await auth_utils.retrieve_string_from_temp_url_safe_string(data.id)
    user_email = auth_utils.decrypt_string(url_safe_string)
    user: User | None = await UserLoginModel.get_user_by_email(user_email)
    if not user or user.id is None:
        raise HTTPException(status_code=404, detail=ERROR_CODES.USER_NOT_FOUND)
    try:
        verified = await auth_utils.verify_otp(user.id, data.otp, "reset")
    except HTTPException:
        await rate_limit.count_attempt(request, "otp", None, WINDOW)
        raise
    if not verified:
        await rate_limit.count_attempt(request, "otp", None, WINDOW)
        raise HTTPException(status_code=401, detail=ERROR_CODES.INVALID_OTP)

    if not user.is_active:
        raise HTTPException(status_code=403, detail=ERROR_CODES.FORBIDDEN)

    user.password = auth_utils.hash_string(data.password)
    await user.save()
    logger.info(f"Password reset for user {user.id}")
    return response_models.MessageResponse(message=Messages.PASSWORD_RESET_SUCCESS)
