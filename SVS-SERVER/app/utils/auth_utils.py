from datetime import datetime, timedelta, timezone
import secrets
import string
import jwt
from pwdlib import PasswordHash
from redis import Redis
from app.config.env import env
from app.models.jwt_model import JWT_DATA
from fastapi.security import OAuth2PasswordBearer
from app.db import cache_session
from app.models.jwt_model import StoredOTPModel
from fastapi import HTTPException
from app.models.error_codes import ERROR_CODES
from loguru import logger


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

hasher = PasswordHash.recommended()


def hash_string(s: str) -> str:
    """Hashes a string using a secure hashing algorithm."""
    return hasher.hash(s)


def verify_hash(s: str, hashed: str) -> bool:
    """Verifies a string against its hashed version."""
    return hasher.verify(s, hashed)


def generate_token(data: JWT_DATA, expires_in: int = 3600) -> str:
    """Generates a JWT token."""
    to_encode = data.model_dump()
    expire = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, env.JWT_SECRET_KEY, algorithm=env.JWT_ALGORITHM)


def verify_token(token: str) -> JWT_DATA:
    """Verifies a JWT token and returns the decoded data."""
    try:
        data = jwt.decode(token, env.JWT_SECRET_KEY, algorithms=[env.JWT_ALGORITHM])
    except jwt.PyJWTError as e:
        raise ValueError("Invalid token") from e
    return JWT_DATA(**data)


def _generate_random_otp(length: int = 6) -> str:
    """Generate a random numeric OTP of given length."""
    otp = "".join(
        secrets.choice(string.ascii_uppercase + string.digits) for _ in range(length)
    )
    logger.debug(f"OTP: {otp}")
    return otp


@cache_session
async def create_otp(user_id: int, cache: Redis | None = None) -> str:
    """Generate and store a one-time password (OTP) for the given user ID."""
    if cache is None:
        logger.error("Redis Cache is None")
        raise HTTPException(500, ERROR_CODES.INTERNAL_SERVER_ERROR)
    otp_hash = hash_string(_generate_random_otp())
    # Store the OTP hash in the database or cache with the user ID
    otp = StoredOTPModel(otp_hash=otp_hash)
    cache.set(
        f"otp:{user_id}", otp.model_dump_json(), ex=env.OTP_EXPIRATION
    )  # OTP expires in 5 minutes
    return otp_hash


@cache_session
async def verify_otp(user_id: int, otp: str, cache: Redis | None = None) -> bool:
    """Verify the provided OTP against the stored hash for the given user ID."""
    if cache is None:
        logger.error("Redis Cache is None")
        raise HTTPException(500, ERROR_CODES.INTERNAL_SERVER_ERROR)
    stored_otp_json = cache.get(f"otp:{user_id}")
    if stored_otp_json is None:
        return False
    stored_otp = StoredOTPModel.model_validate_json(stored_otp_json)
    verified = verify_hash(otp, stored_otp.otp_hash)
    logger.debug(
        f"Stored OTP: {stored_otp} | Provided OTP: {otp} | Verified: {verified}"
    )
    if not verified:
        stored_otp.tries += 1
        if stored_otp.tries > stored_otp.max_tries:
            cache.delete(f"otp:{user_id}")
            raise HTTPException(403, ERROR_CODES.FAILED_OTP_VERIFICATION)
        cache.set(f"otp:{user_id}", stored_otp.model_dump_json(), ex=env.OTP_EXPIRATION)
        return False
    return True
