from typing import Any, Callable, Dict
from fastcrud import FastCRUD, paginated_response
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.db import db_session
from app.models import User
from sqlalchemy import or_


@db_session
async def paginate(
    crud: FastCRUD,
    page: int,
    per_page: int,
    transformer: Callable[[Dict], Any] | None = None,
    db: AsyncSession | None = None,
    sort_orders: list | None = None,
    sort_columns: list | None = None,
    search: str | None = None,
    search_columns: list | None = None,
    **kwargs,
) -> dict:
    """Helper function to get paginated data from CRUD operations."""
    if db is None:
        raise ValueError("Database session 'db' is None.")

    offset = (page - 1) * per_page
    limit = per_page
    data = None
    if search and search_columns:
        data = await crud.get_multi(
            db=db,
            offset=offset,
            limit=limit,
            sort_orders=sort_orders,
            sort_columns=sort_columns,
            _or={f"{column}__ilike": f"%{search}%" for column in search_columns},
            **kwargs,
        )
    else:
        data = await crud.get_multi(
            db=db,
            offset=offset,
            limit=limit,
            sort_orders=sort_orders,
            sort_columns=sort_columns,
            **kwargs,
        )

    if transformer:

        transformed_items = [await transformer(item) for item in data["data"]]
        data = {
            "data": transformed_items,
            "total_count": data.get("total_count", None),
        }
    paginated_data = paginated_response(
        crud_data=data, page=page, items_per_page=per_page
    )
    return paginated_data
