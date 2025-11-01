from fastapi import Request
import time
from loguru import logger
class HTTP_MIDDLEWARE:
    @classmethod
    async def logging(cls, request: Request, call_next):
        logger.debug(f"{cls.__name__} logging started")
        start_time = time.time()

        response = await call_next(request)

        process_time = time.time() - start_time

        # Log to http.log only
        logger.bind(logger_name="http").info(
            f"{request.method} {request.url.path} {response.status_code} {process_time:.3f}s"
        )

        response.headers["X-Process-Time"] = f"{process_time:.3f}s"

        return response
