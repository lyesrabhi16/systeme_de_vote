from fastapi import HTTPException, Request, Response
from fastapi.responses import JSONResponse
from loguru import logger

from app.models import response_models
from app.models.error_codes import ERROR_CODES
from app.models.user_login_model import UserLoginModel
from app.utils.middlewares import HTTPExceptionWithHandler


class AUTH_MIDDLEWARE:
    @classmethod
    async def RequireUnauthenticated(cls, request: Request):
        token = await cls.RetrieveToken(request)
        # only a token that is still good counts: an expired cookie must not stop somebody from signing in again
        if token and await UserLoginModel.get_current_user(token):
            logger.warning("Authenticated user on an unauthenticated route")
            raise HTTPException(status_code=403, detail=ERROR_CODES.ALREADY_AUTHENTICATED)

    @classmethod
    async def RequireAuthenticated(cls, request: Request):
        token = await cls.RetrieveToken(request)
        if not token or not isinstance(token, str):
            logger.warning("No authentication token provided")
            raise HTTPException(status_code=401, detail=ERROR_CODES.AUTHENTICATION_REQUIRED)
        user = await UserLoginModel.get_current_user(token)
        if not user:
            logger.warning("Invalid authentication token.")

            def handler(request: Request, exc: HTTPException) -> JSONResponse:
                response: Response = JSONResponse(
                    response_models.ErrorResponse(detail=ERROR_CODES.INVALID_CREDENTIALS).model_dump(),
                    status_code=401,
                )
                response.delete_cookie("token")
                return response

            raise HTTPExceptionWithHandler(
                handler,
                HTTPException(status_code=401, detail=ERROR_CODES.INVALID_CREDENTIALS),
            )
        if user.is_active is False:
            logger.warning(f"Inactive user attempted to authenticate: {user.username}")

            def handler(request: Request, exc: HTTPException) -> JSONResponse:
                response: Response = JSONResponse(
                    response_models.ErrorResponse(
                        detail=ERROR_CODES.FORBIDDEN
                    ).model_dump(),
                    status_code=403,
                )
                response.delete_cookie("token")
                return response

            raise HTTPExceptionWithHandler(
                handler,
                HTTPException(status_code=403, detail=ERROR_CODES.FORBIDDEN),
            )

        # Attach user to request state for downstream access
        request.state.user = user


    @classmethod
    async def RetrieveToken(cls, request: Request):
        """
        The token of the request: in the JSON body, else in the cookie, else in the Authorization header ("Bearer ...").
        The token itself is never logged.
        """
        try:
            body = await request.json()
        except Exception:
            body = None
        token = body.get("token") if isinstance(body, dict) else None
        token = token or request.cookies.get("token")
        if not token:
            scheme, _, value = request.headers.get("Authorization", "").partition(" ")
            token = value if scheme.lower() == "bearer" else None
        token = token.strip() if isinstance(token, str) else ""
        if not token:
            return None
        request.state.token = token
        return token
