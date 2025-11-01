def test_setup_middlewares():
    from app.utils.middlewares import setup_middlewares
    from fastapi import FastAPI
    from starlette.requests import Request
    from starlette.responses import Response

    APP = FastAPI()

    class SAMPLEMiddleware:
        @classmethod
        async def custom_middleware(cls, request: Request, call_next):
            response = await call_next(request)
            response.headers["X-Custom-Middleware"] = "Active"
            return response

    middlewares = setup_middlewares(APP=APP, MIDDLEWARES=[SAMPLEMiddleware])

    assert "SAMPLEMiddleware:custom_middleware" in middlewares


def test_setup_middlewares_dict():
    from app.utils.middlewares import setup_middlewares
    from fastapi import FastAPI
    from starlette.middleware.base import BaseHTTPMiddleware

    APP = FastAPI()

    class TestMiddlewareClass(BaseHTTPMiddleware):
        async def dispatch(self, request, call_next):
            response = await call_next(request)
            response.headers["X-Test-Middleware"] = "Active"
            return response

    middleware_config = {
        "name": "Test Middleware",
        "middleware_class": TestMiddlewareClass,
        "args": {},
    }

    middlewares = setup_middlewares(APP=APP, MIDDLEWARES=[middleware_config])

    assert "Test Middleware" in middlewares


def test_setup_middlewares_mixed():
    from app.utils.middlewares import setup_middlewares
    from fastapi import FastAPI
    from starlette.requests import Request
    from starlette.responses import Response
    from starlette.middleware.base import BaseHTTPMiddleware

    APP = FastAPI()

    class SAMPLEMiddleware:
        @classmethod
        async def custom_middleware(cls, request: Request, call_next):
            response = await call_next(request)
            response.headers["X-Custom-Middleware"] = "Active"
            return response

    class TestMiddlewareClass(BaseHTTPMiddleware):
        async def dispatch(self, request, call_next):
            response = await call_next(request)
            response.headers["X-Test-Middleware"] = "Active"
            return response

    middleware_config = {
        "name": "Test Middleware",
        "middleware_class": TestMiddlewareClass,
        "args": {},
    }

    middlewares = setup_middlewares(
        APP=APP, MIDDLEWARES=[SAMPLEMiddleware, middleware_config]
    )

    assert "SAMPLEMiddleware:custom_middleware" in middlewares
    assert "Test Middleware" in middlewares


def test_setup_middlewares_no_middlewares():
    from app.utils.middlewares import setup_middlewares
    from fastapi import FastAPI

    APP = FastAPI()

    middlewares = setup_middlewares(APP=APP, MIDDLEWARES=[])

    assert middlewares == ["#API"]
    assert len(middlewares) == 1


def test_setup_middlewares_invalid_dict():
    from app.utils.middlewares import setup_middlewares
    from fastapi import FastAPI

    APP = FastAPI()

    invalid_middleware_config = {
        "name": "Invalid Middleware",
        # Missing 'middleware_class' key
        "args": {},
    }

    middlewares = setup_middlewares(APP=APP, MIDDLEWARES=[invalid_middleware_config])

    assert "Invalid Middleware" not in middlewares
    assert middlewares == ["#API"]
    assert len(middlewares) == 1


def test_setup_middlewares_non_callable_attribute():
    from app.utils.middlewares import setup_middlewares
    from fastapi import FastAPI
    from starlette.requests import Request
    from starlette.responses import Response

    APP = FastAPI()

    class NonCallableMiddleware:
        some_attribute = "I am not callable"

        @classmethod
        async def valid_middleware(cls, request: Request, call_next):
            response = await call_next(request)
            response.headers["X-Valid-Middleware"] = "Active"
            return response

    middlewares = setup_middlewares(APP=APP, MIDDLEWARES=[NonCallableMiddleware])

    assert "NonCallableMiddleware:valid_middleware" in middlewares
    assert all(
        "some_attribute" not in mw for mw in middlewares
    )  # Ensure non-callable attribute is not registered


def test_setup_middlewares_multiple_functions():
    from app.utils.middlewares import setup_middlewares
    from fastapi import FastAPI
    from starlette.requests import Request
    from starlette.responses import Response

    APP = FastAPI()

    class MultiFunctionMiddleware:
        @classmethod
        async def first_middleware(cls, request: Request, call_next):
            response = await call_next(request)
            response.headers["X-First-Middleware"] = "Active"
            return response

        @classmethod
        async def second_middleware(cls, request: Request, call_next):
            response = await call_next(request)
            response.headers["X-Second-Middleware"] = "Active"
            return response

    middlewares = setup_middlewares(APP=APP, MIDDLEWARES=[MultiFunctionMiddleware])

    assert "MultiFunctionMiddleware:first_middleware" in middlewares
    assert "MultiFunctionMiddleware:second_middleware" in middlewares
    assert len(middlewares) == 3  # Including #API


def test_setup_middlewares_order():
    from app.utils.middlewares import setup_middlewares
    from fastapi import FastAPI
    from starlette.requests import Request
    from starlette.responses import Response

    APP = FastAPI()

    class FirstMiddleware:
        @classmethod
        async def process(cls, request: Request, call_next):
            response = await call_next(request)
            response.headers["X-First-Middleware"] = "Active"
            return response

    class SecondMiddleware:
        @classmethod
        async def process(cls, request: Request, call_next):
            response = await call_next(request)
            response.headers["X-Second-Middleware"] = "Active"
            return response

    middlewares = setup_middlewares(
        APP=APP, MIDDLEWARES=[FirstMiddleware, SecondMiddleware]
    )

    assert middlewares.index("SecondMiddleware:process") < middlewares.index(
        "FirstMiddleware:process"
    )  # Second should be before First
    assert middlewares[-1] == "#API"  # API should be last


def test_setup_middlewares_empty_middleware_class():
    from app.utils.middlewares import setup_middlewares
    from fastapi import FastAPI

    APP = FastAPI()

    empty_middleware_config = {
        "name": "Empty Middleware",
        # 'middleware_class' key is missing
        "args": {},
    }

    middlewares = setup_middlewares(APP=APP, MIDDLEWARES=[empty_middleware_config])

    assert "Empty Middleware" not in middlewares
    assert middlewares == ["#API"]
    assert len(middlewares) == 1


def test_setup_middlewares_dict_with_predefined_middleware_class():
    from app.utils.middlewares import setup_middlewares
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware

    APP = FastAPI()

    cors_middleware_config = {
        "name": "CORS Middleware",
        "middleware_class": CORSMiddleware,
        "args": {
            "allow_origins": ["*"],
            "allow_credentials": True,
            "allow_methods": ["*"],
            "allow_headers": ["*"],
        },
    }

    middlewares = setup_middlewares(APP=APP, MIDDLEWARES=[cors_middleware_config])

    assert "CORS Middleware" in middlewares


def test_setup_middlewares_no_callable_methods():
    from app.utils.middlewares import setup_middlewares
    from fastapi import FastAPI

    APP = FastAPI()

    class NoCallableMethodsMiddleware:
        some_value = 42
        another_value = "test"

    middlewares = setup_middlewares(APP=APP, MIDDLEWARES=[NoCallableMethodsMiddleware])

    assert len(middlewares) == 1  # Only #API should be present
    assert middlewares == ["#API"]
