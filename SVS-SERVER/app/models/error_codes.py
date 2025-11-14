from pydantic import BaseModel
from enum import Enum


class ErrorCodeModel(BaseModel):
    code: str
    message: str


class ERROR_CODES(dict, Enum):
    INVALID_CREDENTIALS = ErrorCodeModel(
        code="INVALID_CREDENTIALS",
        message="Invalid credentials",
    )
    USER_NOT_FOUND = ErrorCodeModel(
        code="USER_NOT_FOUND",
        message="User not found",
    )
    UNAUTHORIZED = ErrorCodeModel(
        code="UNAUTHORIZED",
        message="Unauthorized",
    )
    FORBIDDEN = ErrorCodeModel(
        code="FORBIDDEN",
        message="Forbidden",
    )
    TOKEN_EXPIRED = ErrorCodeModel(
        code="TOKEN_EXPIRED",
        message="Token expired",
    )
    TOKEN_INVALID = ErrorCodeModel(
        code="TOKEN_INVALID",
        message="Token invalid",
    )
    INTERNAL_SERVER_ERROR = ErrorCodeModel(
        code="INTERNAL_SERVER_ERROR",
        message="Internal server error",
    )
    BAD_REQUEST = ErrorCodeModel(
        code="BAD_REQUEST",
        message="Bad request",
    )
    AUTHENTICATION_REQUIRED = ErrorCodeModel(
        code="AUTHENTICATION_REQUIRED",
        message="Authentication required",
    )
    ALREADY_AUTHENTICATED = ErrorCodeModel(
        code="ALREADY_AUTHENTICATED",
        message="User is already authenticated",
    )
    INVALID_OTP = ErrorCodeModel(
        code="INVALID_OTP",
        message="Invalid OTP",
    )
    FAILED_OTP_VERIFICATION = ErrorCodeModel(
        code="FAILED_OTP_VERIFICATION",
        message="Failed OTP verification",
    )
