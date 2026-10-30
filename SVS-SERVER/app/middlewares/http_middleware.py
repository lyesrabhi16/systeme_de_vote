import time

from fastapi import Request
from loguru import logger

from app.config.env import ENV_MODES, env


class HTTP_MIDDLEWARE:
    @classmethod
    async def security_headers(cls, request: Request, call_next):
        """
        Headers that tell the browser not to guess, not to frame the page, and not to keep what the API answers (sign-in steps, ballots).
        (The reverse proxy of a deployment may add its own; these make the application safe on its own too.)
        """
        response = await call_next(request)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "no-referrer")
        response.headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        if not request.url.path.startswith(("/public", "/docs", "/redoc")):
            response.headers.setdefault("Cache-Control", "no-store")
        if env.ENV_MODE == ENV_MODES.PRODUCTION:
            response.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
        return response

    @classmethod
    async def logging(cls, request: Request, call_next):
        start_time = time.time()

        response = await call_next(request)

        process_time = time.time() - start_time

        # Log to http.log only
        logger.bind(logger_name="http").info(
            f"{request.method} {request.url.path} {response.status_code} {process_time:.3f}s"
        )

        response.headers["X-Process-Time"] = f"{process_time:.3f}s"

        return response
