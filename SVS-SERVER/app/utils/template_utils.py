from datetime import datetime

from app.config.env import env


def create_template_context(context: dict) -> dict:
    """Create a context dictionary for rendering templates"""

    return {
        "APP_NAME": env.APP_NAME,
        "YEAR": datetime.now().year,
        **context,
    }
