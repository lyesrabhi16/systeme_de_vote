from fastapi import APIRouter, Depends, Query
from app.middlewares.routes_guards_middleware import ROUTES_GUARDS_MIDDLEWARE
from app.middlewares.auth_middleware import AUTH_MIDDLEWARE
from app.models.user import UserResponseModel
from fastcrud import FastCRUD, PaginatedListResponse
from app.models import User
from app.utils.utils import paginate
from typing import Dict
from app.utils import transformers

router = APIRouter()
crud = FastCRUD(model=User)


@router.get(
    "/admin-only-endpoint",
    operation_id="admin_only_endpoint",
    dependencies=[
        Depends(AUTH_MIDDLEWARE.RequireAuthenticated),
        Depends(ROUTES_GUARDS_MIDDLEWARE.AdminOnly),
    ],
)
async def admin_only_endpoint():
    return {"message": "you have accessed an admin-only endpoint."}


@router.get(
    "/",
    operation_id="get_admins",
    response_model=PaginatedListResponse[UserResponseModel],
    dependencies=[
        Depends(AUTH_MIDDLEWARE.RequireAuthenticated),
        Depends(ROUTES_GUARDS_MIDDLEWARE.AdminOnly),
    ],
)
async def get_admins(
    page: int = 1,
    per_page: int = Query(default=10, min=1, max=100),
):

    return await paginate(
        crud=crud,
        page=page,
        per_page=per_page,
        transformer=transformers.User_to_UserResponseModel,
        is_admin=True,
    )
