from fastapi import Request, HTTPException
from loguru import logger
from app.models.error_codes import ERROR_CODES


class ROUTES_GUARDS_MIDDLEWARE:
    @classmethod
    async def AdminOnly(cls, request: Request):
        logger.debug(f"{cls.__name__} AdminOnly Guard middleware started")
        user = getattr(request.state, "user", None)
        if not user:
            logger.error("No user found in request state for AdminOnly guard")
            raise HTTPException(
                status_code=500, detail=ERROR_CODES.AUTHENTICATION_REQUIRED
            )
        if not user.is_admin:
            logger.warning(f"User {user.username} attempted to access admin-only route")
            raise HTTPException(
                status_code=403, detail=ERROR_CODES.ADMIN_PRIVILEGES_REQUIRED
            )
        logger.debug(
            f"User {request.state.user.username} passed AdminOnly guard successfully."
        )
