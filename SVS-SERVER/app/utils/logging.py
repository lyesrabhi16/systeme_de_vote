from loguru import logger
import sys
from pathlib import Path
from app.config.env import env, ENV_MODES
import logging


def setup_logging():
    """Configure loguru to replace standard logging"""

    # Remove default handler
    logger.remove()

    # Determine log level based on environment
    log_level = "DEBUG" if env.ENV_MODE == ENV_MODES.DEVELOPMENT else "INFO"

    # Console handler with colors
    logger.add(
        sys.stdout,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        level=log_level,
        colorize=True,
    )

    # File handler for all logs
    log_path = Path("logs")
    log_path.mkdir(exist_ok=True)

    logger.add(
        log_path / "app.log",
        rotation="500 MB",  # Rotate when file reaches 500MB
        retention="10 days",  # Keep logs for 10 days
        compression="zip",  # Compress rotated logs
        level=log_level,
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
    )

    # Separate file for errors
    logger.add(
        log_path / "errors.log",
        rotation="100 MB",
        retention="30 days",
        compression="zip",
        level="ERROR",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
    )

    # Separate file for HTTP access logs
    logger.add(
        log_path / "http.log",
        rotation="100 MB",
        retention="30 days",
        compression="zip",
        level="INFO",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {extra.get('logger_name', 'unknown')} - {message}",
        filter=lambda record: record["extra"].get("logger_name") == "http",
    )

    # JSON format for production (optional)
    if env.ENV_MODE == ENV_MODES.PRODUCTION:
        logger.add(
            log_path / "app.json",
            rotation="500 MB",
            retention="10 days",
            compression="zip",
            level="INFO",
            serialize=True,  # Output as JSON
        )

    logger.info(f"Logging configured for {env.ENV_MODE.value} environment")


class InterceptHandler(logging.Handler):
    """
    Intercept standard logging messages and redirect to loguru
    """

    def emit(self, record):
        # Get corresponding Loguru level if it exists
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno

        # Find caller from where the logged message originated
        frame, depth = logging.currentframe(), 2
        while frame.f_code.co_filename == logging.__file__:
            frame = frame.f_back
            depth += 1

        logger.opt(depth=depth, exception=record.exc_info).log(
            level, record.getMessage()
        )


def intercept_standard_logging():
    """
    Intercept all standard logging and redirect to loguru
    """
    # Remove all handlers from root logger
    logging.root.handlers = [InterceptHandler()]
    logging.root.setLevel(logging.INFO)

    # Intercept specific loggers
    for name in logging.root.manager.loggerDict.keys():
        logging.getLogger(name).handlers = []
        logging.getLogger(name).propagate = True

    # Intercept uvicorn loggers
    logging.getLogger("uvicorn").handlers = [InterceptHandler()]
    logging.getLogger("uvicorn.access").handlers = [InterceptHandler()]
    logging.getLogger("uvicorn.error").handlers = [InterceptHandler()]

    # Silence uvicorn's file watcher logs
    logging.getLogger("watchfiles").setLevel(logging.WARNING)

    # Intercept FastAPI logger
    logging.getLogger("fastapi").handlers = [InterceptHandler()]
