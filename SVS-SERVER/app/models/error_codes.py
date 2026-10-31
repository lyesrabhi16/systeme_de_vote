from enum import Enum

from pydantic import BaseModel


class ErrorCodeModel(BaseModel):
    code: str
    message: str


class ERROR_CODES(dict, Enum):
    BLIND_SIGNATURE_ALREADY_ISSUED = ErrorCodeModel(
        code="BLIND_SIGNATURE_ALREADY_ISSUED",
        message="Blind signature has already been issued for this vote",
    )
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
    RATE_LIMIT_EXCEEDED = ErrorCodeModel(
        code="RATE_LIMIT_EXCEEDED",
        message="Rate limit exceeded",
    )
    NOT_FOUND = ErrorCodeModel(
        code="NOT_FOUND",
        message="Resource not found",
    )
    VOTE_FINISHED = ErrorCodeModel(
        code="VOTE_FINISHED",
        message="Vote is already finished",
    )
    ALREADY_VOTED = ErrorCodeModel(
        code="ALREADY_VOTED",
        message="User has already voted on this vote",
    )
    ADMIN_PRIVILEGES_REQUIRED = ErrorCodeModel(
        code="ADMIN_PRIVILEGES_REQUIRED",
        message="Admin privileges are required to access this resource",
    )
    EMAIL_ALREADY_EXISTS = ErrorCodeModel(
        code="EMAIL_ALREADY_EXISTS",
        message="Email already exists",
    )
    PHONE_NUMBER_ALREADY_EXISTS = ErrorCodeModel(
        code="PHONE_NUMBER_ALREADY_EXISTS",
        message="Phone number already exists",
    )
    USERNAME_ALREADY_EXISTS = ErrorCodeModel(
        code="USERNAME_ALREADY_EXISTS",
        message="Username already exists",
    )
    USER_ALREADY_VOTED = ErrorCodeModel(
        code="USER_ALREADY_VOTED",
        message="User has already voted on this vote",
    )
    INSCRIPTION_AUTHORITY_REQUIRED = ErrorCodeModel(
        code="INSCRIPTION_AUTHORITY_REQUIRED",
        message="Inscription authority is required to access this resource",
    )
    VOTE_AUTHORITY_REQUIRED = ErrorCodeModel(
        code="VOTE_AUTHORITY_REQUIRED",
        message="Vote authority is required to access this resource",
    )
    VOTE_FINISHED_CANNOT_UPDATE = ErrorCodeModel(
        code="VOTE_FINISHED_CANNOT_UPDATE",
        message="Vote is already finished and cannot be modified",
    )
    VOTE_STARTED_CANNOT_UPDATE = ErrorCodeModel(
        code="VOTE_STARTED_CANNOT_UPDATE",
        message="Vote has already started and cannot be modified",
    )
    VOTE_FINISHED_CANNOT_DELETE = ErrorCodeModel(
        code="VOTE_FINISHED_CANNOT_DELETE",
        message="Vote is already finished and cannot be deleted",
    )
    VOTE_STARTED_CANNOT_DELETE = ErrorCodeModel(
        code="VOTE_STARTED_CANNOT_DELETE",
        message="Vote has already started and cannot be deleted",
    )
    VOTE_NOT_STARTED = ErrorCodeModel(
        code="VOTE_NOT_STARTED",
        message="Vote has not started yet",
    )
    VOTE_NOT_FINISHED = ErrorCodeModel(
        code="VOTE_NOT_FINISHED",
        message="Vote is not finished yet",
    )
    NOT_ELIGIBLE = ErrorCodeModel(
        code="NOT_ELIGIBLE",
        message="User is not allowed to vote on this vote",
    )
    INVALID_CANDIDATE = ErrorCodeModel(
        code="INVALID_CANDIDATE",
        message="This is not a candidate of this vote",
    )
    INVALID_BALLOT = ErrorCodeModel(
        code="INVALID_BALLOT",
        message="This ballot cannot be counted: it must have one proven 0-or-1 entry for each candidate, and at most one 1",
    )
