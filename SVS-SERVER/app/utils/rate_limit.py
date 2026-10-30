import hashlib

from fastapi import HTTPException, Request
from loguru import logger
from redis.asyncio import Redis

from app.db import cache_session
from app.models.error_codes import ERROR_CODES


def _key(scope: str, kind: str, value: str) -> str:
    """A key of the cache. The value (an address, an email) is hashed: no personal data in Redis keys."""
    return f"rl:{scope}:{kind}:{hashlib.sha256(value.encode()).hexdigest()[:24]}"


def client_address(request: Request) -> str:
    return request.client.host if request.client else "unknown"


@cache_session
async def ensure_below(
    request: Request,
    scope: str,
    subject: str | None,
    limit: int,
    ip_limit: int,
    cache: Redis | None = None,
) -> None:
    """Refuses (429) when this address, or this subject (an email, a login), has already failed `limit` times in the window."""
    if cache is None:
        raise HTTPException(500, ERROR_CODES.INTERNAL_SERVER_ERROR)
    keys = [(_key(scope, "ip", client_address(request)), ip_limit)]
    if subject:
        keys.append((_key(scope, "id", subject.strip().lower()), limit))
    for key, maximum in keys:
        used = int(await cache.get(key) or 0)
        if used >= maximum:
            retry_after = max(int(await cache.ttl(key)), 1)
            logger.warning(f"Rate limit reached for {scope}")
            raise HTTPException(
                status_code=429,
                detail=ERROR_CODES.RATE_LIMIT_EXCEEDED,
                headers={"Retry-After": str(retry_after)},
            )


@cache_session
async def count_attempt(
    request: Request,
    scope: str,
    subject: str | None,
    window: int,
    cache: Redis | None = None,
) -> None:
    """Counts one attempt (a failure, or a request that must not be repeated at will) for this address and this subject."""
    if cache is None:
        raise HTTPException(500, ERROR_CODES.INTERNAL_SERVER_ERROR)
    keys = [_key(scope, "ip", client_address(request))]
    if subject:
        keys.append(_key(scope, "id", subject.strip().lower()))
    for key in keys:
        if await cache.incr(key) == 1:
            await cache.expire(key, window)
