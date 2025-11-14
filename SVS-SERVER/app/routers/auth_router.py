from typing import Optional
from fastapi import APIRouter, HTTPException, Request, Response, Depends
from app.models.user_login_model import UserLoginModel
from app.models.user import CurrentUserResponseModel, User
from app.utils import auth_utils
from app.config.env import env, ENV_MODES
from app.models.jwt_model import (
    JWT_DATA,
    TokenInput,
    TokenResponse,
    OTPVerificationModel,
)
from loguru import logger
from app.middlewares.auth_middleware import AUTH_MIDDLEWARE
from app.models.error_codes import ERROR_CODES
from app.models.messages import Messages
from app.models import response_models

router = APIRouter()


@router.post(
    "/login",
    response_model=response_models.MessageResponse,
    dependencies=[Depends(AUTH_MIDDLEWARE.RequireUnauthenticated)],
    operation_id="login",
)
async def login(data: UserLoginModel, response: Response):
    # check credentials
    user = await UserLoginModel.authenticate(
        identifier=data.identifier,
        password=data.password,
        identifier_type=data.identifier_type,
    )
    logger.debug(
        f"Login attempt for user: {data.identifier} using {data.identifier_type}, Success: {user is not None}"
    )
    if not user:
        raise HTTPException(status_code=401, detail=ERROR_CODES.INVALID_CREDENTIALS)
    # generate OTP
    await auth_utils.create_otp(user.id)

    return response_models.MessageResponse(message=Messages.LOGIN_SUCCESS)


@router.post(
    "/verify-otp",
    response_model=TokenResponse,
    dependencies=[Depends(AUTH_MIDDLEWARE.RequireUnauthenticated)],
)
async def verify_otp(data: OTPVerificationModel, response: Response):
    user = await UserLoginModel.get_user_by_email(data.user_email)
    if not user:
        raise HTTPException(status_code=404, detail=ERROR_CODES.USER_NOT_FOUND)
    if not await auth_utils.verify_otp(user.id, data.otp):
        raise HTTPException(status_code=401, detail=ERROR_CODES.INVALID_OTP)

    # generate token
    if not user.is_active or (user.id is None):
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
    return TokenResponse(token=token)


@router.post(
    "/logout",
    response_model=response_models.MessageResponse,
    dependencies=[Depends(AUTH_MIDDLEWARE.RequireAuthentication)],
    operation_id="logout",
)
async def logout(response: Response):
    response.delete_cookie("token")
    return response_models.MessageResponse(message=Messages.LOGOUT_SUCCESS)


@router.post(
    "/user/me",
    response_model=CurrentUserResponseModel,
    dependencies=[Depends(AUTH_MIDDLEWARE.RequireAuthentication)],
    operation_id="get_current_user",
)
async def get_current_user(request: Request, data: Optional[TokenInput]):
    """Get the current user information"""

    token = data.token if data else request.state.token
    user: User | None = await UserLoginModel.get_current_user(token)
    if user is None:
        raise HTTPException(status_code=404, detail=ERROR_CODES.USER_NOT_FOUND)
    if user.is_active is False:
        raise HTTPException(status_code=403, detail=ERROR_CODES.FORBIDDEN)
    return user
