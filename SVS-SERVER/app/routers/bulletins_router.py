from fastapi import APIRouter, Query
from fastcrud import FastCRUD, PaginatedListResponse

from app.models.bulletin import Bulletin
from app.utils.response_utils import paginate

router = APIRouter()
crud = FastCRUD(model=Bulletin)


@router.get(
    "/",
    operation_id="get_all_bulletins",
    response_model=PaginatedListResponse[Bulletin],
)
async def get_all_bulletins(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=10, ge=1, le=100),
    search: str | None = None,
    vote_id: int | None = Query(default=None),
):
    optionals = {}
    if vote_id is not None:
        optionals["vote_id"] = vote_id
    return await paginate(
        crud=crud,
        page=page,
        per_page=per_page,
        search=search,
        search_columns=["unique_code"],
        sort_columns=["id"],
        sort_orders=["asc"],
        **optionals
    )
