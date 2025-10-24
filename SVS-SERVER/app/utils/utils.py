from app.config.globals import BASE_DIR


def get_real_path(*args: str) -> str:
    """Constructs a file path by joining the given arguments with the BASE_DIR"""
    import os

    return os.path.join(BASE_DIR, *args)
