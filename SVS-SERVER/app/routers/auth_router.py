from typing import Optional
from fastapi import APIRouter, HTTPException, Request, Response, Depends
from app.models.user_login_model import UserLoginModel
from app.models.user import CurrentUserResponseModel, User
from app.utils import auth_utils
from app.config.env import env
from app.models.jwt_model import JWT_DATA, TokenDTO
from loguru import logger
from app.middlewares.auth_middleware import AUTH_MIDDLEWARE
from app.models.error_codes import ERROR_CODES
from app.models.messages import Messages

router = APIRouter()


@router.post("/login", dependencies=[Depends(AUTH_MIDDLEWARE.RequireUnauthenticated)])
async def login(data: UserLoginModel, response: Response):
    # check credentials
    user = await UserLoginModel.authenticate(data.username, data.password)
    logger.debug(
        f"Login attempt for user: {data.username}, Success: {user is not None}"
    )
    if not user:
        raise HTTPException(status_code=401, detail=ERROR_CODES.INVALID_CREDENTIALS)

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
        max_age=env.JWT_EXPIRATION if data.remember_me else None,
    )
    return {"token": token}


@router.post("/logout", dependencies=[Depends(AUTH_MIDDLEWARE.RequireAuthentication)])
async def logout(response: Response):
    response.delete_cookie("token")
    return {"message": Messages.LOGOUT_SUCCESS}


@router.post(
    "/user/me",
    response_model=CurrentUserResponseModel,
    dependencies=[Depends(AUTH_MIDDLEWARE.RequireAuthentication)],
)
async def get_current_user(request: Request, data: Optional[TokenDTO]):
    """Get the current user information"""

    token = data.token if data else request.state.token
    user: User | None = await UserLoginModel.get_current_user(token)
    if user is None:
        raise HTTPException(status_code=404, detail=ERROR_CODES.USER_NOT_FOUND)
    if user.is_active is False:
        raise HTTPException(status_code=403, detail=ERROR_CODES.FORBIDDEN)
    return user
