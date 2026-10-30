import secrets
import string
from datetime import UTC, datetime, timedelta

import jwt
from cryptography.fernet import Fernet
from fastapi import HTTPException
from loguru import logger
from pwdlib import PasswordHash
from redis.asyncio import Redis

from app.config.env import env
from app.db import cache_session
from app.models.auth_models import JWT_DATA, StoredOTPModel
from app.models.error_codes import ERROR_CODES

hasher = PasswordHash.recommended()
crypto = Fernet(env.ENCRYPTION_KEY)

# A hash to check a password against when the user does not exist, so that an unknown user takes as long to refuse as a known one.
_UNKNOWN_USER_HASH = hasher.hash(secrets.token_urlsafe(16))


def generate_unique_code() -> str:
    """Generates a unique code for vote bulletins."""
    return secrets.token_urlsafe(32)


def generate_unique_hash(**args) -> str:
    """Generates a unique hash based on the provided arguments."""
    concat_str = "|".join(f"{key}={value}" for key, value in sorted(args.items()))
    return hash_string(concat_str)


def encrypt_string(s: str) -> str:
    """Encrypts a string with the ENCRYPTION_KEY: the private key of an election, and what is kept in the cache for a few minutes."""
    return crypto.encrypt(s.encode()).decode()


def decrypt_string(s: str) -> str:
    """Decrypts a string made by encrypt_string."""
    return crypto.decrypt(s).decode()


@cache_session
async def generate_temp_url_safe_string(s: str, cache: Redis | None = None) -> str:
    """Keeps a string in the cache for a few minutes and returns a random, url safe, identifier for it."""
    id_token = secrets.token_urlsafe(32)
    if cache is None:
        logger.error("Redis Cache is None")
        raise HTTPException(500, ERROR_CODES.INTERNAL_SERVER_ERROR)
    await cache.set(f"enc:{id_token}", s, ex=env.OTP_EXPIRATION)
    return id_token


@cache_session
async def retrieve_string_from_temp_url_safe_string(s: str, cache: Redis | None = None) -> str:
    """Retrieves the original string from the temporary url safe string."""
    if cache is None:
        logger.error("Redis Cache is None")
        raise HTTPException(500, ERROR_CODES.INTERNAL_SERVER_ERROR)
    original = await cache.get(f"enc:{s}")
    if original is None:
        logger.warning("A temporary identifier was not found in the cache (expired or made up)")
        raise HTTPException(400, ERROR_CODES.BAD_REQUEST)
    return original


def hash_string(s: str) -> str:
    """Hashes a string using a secure hashing algorithm."""
    return hasher.hash(s)


def verify_hash(s: str, hashed: str) -> bool:
    """Verifies a string against its hashed version."""
    return hasher.verify(s, hashed)


def burn_password_check(password: str) -> None:
    """Does the work of checking a password, for a user who does not exist."""
    hasher.verify(password or "", _UNKNOWN_USER_HASH)


def generate_token(data: JWT_DATA, expires_in: int = 3600) -> str:
    """Generates a JWT token."""
    to_encode = data.model_dump()
    expire = datetime.now(UTC) + timedelta(seconds=expires_in)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, env.JWT_SECRET_KEY, algorithm=env.JWT_ALGORITHM)


def verify_token(token: str) -> JWT_DATA:
    """Verifies a JWT token and returns the decoded data."""
    try:
        data = jwt.decode(token, env.JWT_SECRET_KEY, algorithms=[env.JWT_ALGORITHM])
    except jwt.PyJWTError as e:
        logger.warning(f"Token verification failed: {e}")
        raise ValueError("Invalid token") from e
    return JWT_DATA(**data)


OTP_LENGTH = 6
_OTP_ALPHABET = string.ascii_uppercase + string.digits


def _generate_random_otp(length: int = OTP_LENGTH) -> str:
    """Generate a random OTP of given length (capital letters and digits)."""
    return "".join(secrets.choice(_OTP_ALPHABET) for _ in range(length))


def normalize_otp(otp: str) -> str:
    """What was typed, as it was sent (the code is in capitals, whatever the keyboard)."""
    return otp.strip().upper()


@cache_session
async def create_otp(user_id: int, purpose: str = "login", cache: Redis | None = None) -> str:
    """
    Generate and store a one-time password (OTP) for the given user ID. Only a hash of it is kept.
    A code is for one purpose ("login", "reset"): the one that signs somebody in cannot reset a password, nor the other way round.
    """
    if cache is None:
        logger.error("Redis Cache is None")
        raise HTTPException(500, ERROR_CODES.INTERNAL_SERVER_ERROR)
    otp = _generate_random_otp()
    _otp = StoredOTPModel(otp_hash=hash_string(otp))
    await cache.set(f"otp:{purpose}:{user_id}", _otp.model_dump_json(), ex=env.OTP_EXPIRATION)
    return otp


@cache_session
async def remove_otp(user_id: int, purpose: str = "login", cache: Redis | None = None) -> None:
    """Remove the OTP for the given user ID from the cache."""
    if cache is None:
        logger.error("Redis Cache is None")
        raise HTTPException(500, ERROR_CODES.INTERNAL_SERVER_ERROR)
    await cache.delete(f"otp:{purpose}:{user_id}")


@cache_session
async def verify_otp(user_id: int, otp: str, purpose: str = "login", cache: Redis | None = None) -> bool:
    """
    Verify the provided OTP against the stored hash for the given user ID.
    A code works once: it is removed as soon as it is right. After max_tries wrong ones it is removed too, and the user must ask for another.
    """
    if cache is None:
        logger.error("Redis Cache is None")
        raise HTTPException(500, ERROR_CODES.INTERNAL_SERVER_ERROR)
    key = f"otp:{purpose}:{user_id}"
    stored_otp_json = await cache.get(key)
    if stored_otp_json is None:
        return False
    stored_otp = StoredOTPModel.model_validate_json(stored_otp_json)
    if verify_hash(normalize_otp(otp), stored_otp.otp_hash):
        await remove_otp(user_id, purpose)
        return True
    stored_otp.tries += 1
    if stored_otp.tries >= stored_otp.max_tries:
        await remove_otp(user_id, purpose)
        logger.warning(f"Too many wrong OTPs for user {user_id}")
        raise HTTPException(403, ERROR_CODES.FAILED_OTP_VERIFICATION)
    ttl = await cache.ttl(key)
    await cache.set(
        key,
        stored_otp.model_dump_json(),
        ex=ttl if ttl and ttl > 0 else env.OTP_EXPIRATION,  # the code does not live longer for being tried
    )
    return False
