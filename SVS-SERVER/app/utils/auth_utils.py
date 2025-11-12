from datetime import datetime, timedelta, timezone
import jwt
from pwdlib import PasswordHash
from app.config.env import env
from app.models.jwt_model import JWT_DATA
from fastapi.security import OAuth2PasswordBearer

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
