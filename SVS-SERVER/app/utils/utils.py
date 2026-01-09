from fastcrud import FastCRUD, paginated_response
from app.config.globals import BASE_DIR
from typing import Any, Callable, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.db import db_session


def get_real_path(*args: str) -> str:
    """Constructs a file path by joining the given arguments with the BASE_DIR"""
    import os

    return os.path.join(BASE_DIR, *args)


@db_session
async def paginate(
    crud: FastCRUD,
    page: int,
    per_page: int,
    transformer: Callable[[Dict], Any] | None = None,
    db: AsyncSession | None = None,
    **kwargs
) -> dict:
    """Helper function to get paginated data from CRUD operations."""
    if db is None:
        raise ValueError("Database session 'db' is None.")

    offset = (page - 1) * per_page
    limit = per_page
    data = await crud.get_multi(db=db, offset=offset, limit=limit, **kwargs)

    if transformer:

        transformed_items = [await transformer(item) for item in data["data"]]
        print("TRANSFORMED ITEMS: ", transformed_items)
        data = {
            "data": transformed_items,
            "total_count": len(transformed_items),
        }
    paginated_data = paginated_response(
        crud_data=data, page=page, items_per_page=per_page
    )
    print("PAGINATED DATA: ", paginated_data)
    return paginated_data
