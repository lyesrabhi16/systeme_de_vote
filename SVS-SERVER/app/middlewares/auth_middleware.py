from typing import Any
from fastapi import HTTPException, Request, Response
from fastapi.responses import JSONResponse
from app.models.user_login_model import UserLoginModel
from loguru import logger
from app.models.error_codes import ERROR_CODES
from app.models import response_models
from app.utils.middlewares import HTTPExceptionWithHandler


class AUTH_MIDDLEWARE:
    @classmethod
    async def RequireUnauthenticated(cls, request: Request):
        logger.debug(f"{cls.__name__} RequireUnauthenticated started")
        token: str | Any = await cls.RetrieveToken(request)
        if token:
            logger.warning("Authentication token provided for unauthenticated route")
            raise HTTPException(
                status_code=403, detail=ERROR_CODES.ALREADY_AUTHENTICATED
            )

    @classmethod
    async def RequireAuthenticated(cls, request: Request):
        logger.debug(f"{cls.__name__} RequireAuthentication started")
        token = await cls.RetrieveToken(request)
        if not token or not isinstance(token, str):
            logger.warning("No authentication token provided")
            raise HTTPException(
                status_code=401, detail=ERROR_CODES.AUTHENTICATION_REQUIRED
            )
        user = await UserLoginModel.get_current_user(token)
        if not user:
            logger.warning("Invalid authentication token.")

            def handler(request: Request, exc: HTTPException) -> JSONResponse:
                response: Response = JSONResponse(
                    response_models.ErrorResponse(
                        detail=ERROR_CODES.INVALID_CREDENTIALS
                    ).model_dump(),
                    status_code=401,
                )
                response.delete_cookie("token")
                return response

            raise HTTPExceptionWithHandler(
                handler,
                HTTPException(status_code=401, detail=ERROR_CODES.INVALID_CREDENTIALS),
            )

        # Attach user to request state for downstream access
        request.state.user = user
        logger.debug(f"User {request.state.user.username} authenticated successfully.")

    @classmethod
    async def RetrieveToken(cls, request: Request):
        logger.debug(f"{cls.__name__} token retrieval started")
        try:
            json_data = await request.json()
        except Exception:
            json_data = {}
        token_from_json_data = json_data.get("token", None)
        token_from_cookies = request.cookies.get("token", None)
        token_from_headers = (
            request.headers.get("Authorization", "").split("Bearer ")[-1].strip()
        )
        if token_from_json_data:
            logger.debug(
                "Token found in JSON data. token: " + str(token_from_json_data)
            )
        if token_from_cookies:
            logger.debug("Token found in cookies. token: " + str(token_from_cookies))
        if token_from_headers:
            logger.debug("Token found in headers. token: " + str(token_from_headers))
        token: str | None = (
            token_from_json_data or token_from_cookies or token_from_headers
        )
        if not token or token.strip() == "":
            logger.warning("No authentication token provided")
            return None
        json_data["token"] = token
        request.state.token = token
        logger.debug("Authentication token retrieved successfully.")
        return token
