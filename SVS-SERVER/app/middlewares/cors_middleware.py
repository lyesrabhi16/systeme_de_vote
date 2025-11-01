from fastapi.middleware.cors import CORSMiddleware
from app.config.env import env

CORS_MIDDLEWARE = {
    "name": "CORS Middleware",
    "middleware_class": CORSMiddleware,
    "args": {
        "allow_origins": env.ALLOWED_ORIGINS,
        "allow_credentials": True,
        "allow_methods": ["*"],
        "allow_headers": ["*"],
    },
}
