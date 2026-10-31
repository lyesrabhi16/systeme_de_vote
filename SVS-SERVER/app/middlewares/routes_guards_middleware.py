from fastapi import HTTPException, Request
from loguru import logger

from app.models.error_codes import ERROR_CODES


class ROUTES_GUARDS_MIDDLEWARE:
    @classmethod
    async def AdminOnly(cls, request: Request):
        logger.debug(f"{cls.__name__} AdminOnly Guard middleware started")
        user = getattr(request.state, "user", None)
        if not user:
            logger.error("No user found in request state for AdminOnly guard")
            raise HTTPException(status_code=500, detail=ERROR_CODES.AUTHENTICATION_REQUIRED)
        if not user.is_admin:
            logger.warning(f"User {user.username} attempted to access admin-only route")
            raise HTTPException(status_code=403, detail=ERROR_CODES.ADMIN_PRIVILEGES_REQUIRED)
        logger.debug(f"User {request.state.user.username} passed AdminOnly guard successfully.")

    @classmethod
    async def InscriptionAuthorityOnly(cls, request: Request):
        logger.debug(f"{cls.__name__} InscriptionAuthorityOnly Guard middleware started")
        user = getattr(request.state, "user", None)
        if not user:
            logger.error("No user found in request state for InscriptionAuthorityOnly guard")
            raise HTTPException(status_code=500, detail=ERROR_CODES.AUTHENTICATION_REQUIRED)
        if user.authority != "Inscription":
            logger.warning(f"User {user.username} attempted to access inscription authority-only route")
            raise HTTPException(status_code=403, detail=ERROR_CODES.INSCRIPTION_AUTHORITY_REQUIRED)
        logger.debug(f"User {request.state.user.username} passed InscriptionAuthorityOnly guard successfully.")

    @classmethod
    async def VoteAuthorityOnly(cls, request: Request):
        logger.debug(f"{cls.__name__} VoteAuthorityOnly Guard middleware started")
        user = getattr(request.state, "user", None)
        if not user:
            logger.error("No user found in request state for VoteAuthorityOnly guard")
            raise HTTPException(status_code=500, detail=ERROR_CODES.AUTHENTICATION_REQUIRED)
        if user.authority != "Vote":
            logger.warning(f"User {user.username} attempted to access vote authority-only route")
            raise HTTPException(status_code=403, detail=ERROR_CODES.VOTE_AUTHORITY_REQUIRED)
        logger.debug(f"User {request.state.user.username} passed VoteAuthorityOnly guard successfully.")
