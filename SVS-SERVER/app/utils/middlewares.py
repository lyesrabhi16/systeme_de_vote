from typing import Callable, List
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from loguru import logger


def setup_middlewares(APP: FastAPI, MIDDLEWARES: list | None = None) -> List[str]:
    """
    Setup all middlewares for the FastAPI app.
    Args:
        APP (FastAPI): The FastAPI application instance.
        MIDDLEWARES (list): A list of middleware classes or configurations to be added.
    Returns:
        List[str]: The order of middleware execution for a request (response is the reverse order).
    """
    if MIDDLEWARES is None:
        MIDDLEWARES = []
    middleware_order = ["#API"]

    for middleware in MIDDLEWARES:
        if isinstance(middleware, dict):
            middleware_name = middleware.get("name", "UnnamedMiddleware")
            logger.info(f"Setting up middleware: {middleware_name}")
            middleware_class = middleware.get("middleware_class", None)
            if middleware_class is None:
                logger.warning(
                    f"Middleware class not found for {middleware_name}. Skipping."
                )
                continue
            middleware_args = middleware.get("args", {})
            APP.add_middleware(middleware_class, **middleware_args)
            middleware_order.insert(0, middleware_name)
            logger.debug(f"Registered middleware: {middleware_name}")

            continue

        logger.info(f"Setting up middleware: {middleware.__name__}")
        all_middleware_functions = list(
            filter(
                lambda x: callable(getattr(middleware, x)) and not x.startswith("__"),
                dir(middleware),
            )
        )
        logger.debug(f"Middleware functions found: {all_middleware_functions}")

        for func_name in all_middleware_functions:
            middleware_name = f"{middleware.__name__}:{func_name}"
            func = getattr(middleware, func_name)
            # register each func
            register_middleware_func(APP, func, middleware_name)
            middleware_order.insert(0, middleware_name)
            logger.debug(f"Registered middleware: {middleware_name}")

        logger.info(f"Middleware {middleware.__name__} has been set up.")

    logger.debug(f"Middleware Execution Order: {middleware_order}")

    return middleware_order


def register_middleware_func(APP: FastAPI, func, middleware_name: str):
    """Register a single middleware function safely."""

    async def middleware_wrapper(request: Request, call_next):
        # Call the original middleware function
        return await func(request, call_next)

    APP.middleware("http")(middleware_wrapper)
    logger.info(f"Registered middleware: {middleware_name}")


class HTTPExceptionWithHandler(HTTPException):

    def __init__(
        self,
        handler: Callable[[Request, "HTTPExceptionWithHandler"], JSONResponse],
        exc: HTTPException,
    ):
        self.handler: Callable[[Request, HTTPExceptionWithHandler], JSONResponse] = (
            handler
        )
        super().__init__(
            status_code=exc.status_code,
            detail=exc.detail,
            headers=exc.headers.__dict__ if exc.headers else None,
        )


def register_http_exception_handler(APP: FastAPI):
    @APP.exception_handler(HTTPExceptionWithHandler)
    async def http_exception_handler(request: Request, exc: HTTPExceptionWithHandler):
        return exc.handler(request, exc)

    logger.info("Registered HTTPExceptionWithHandler exception handler.")
    logger.debug("HTTPExceptionWithHandler exception handler setup complete.")
