from fastapi import APIRouter, Request, Depends, HTTPException
from app.middlewares.auth_middleware import AUTH_MIDDLEWARE
from app.models import User, Vote
from app.models.user import UserResponseModel
from loguru import logger

router = APIRouter()


@router.get(
    "/:id",
    operation_id="get_user_by_id",
    response_model=UserResponseModel,
    dependencies=[Depends(AUTH_MIDDLEWARE.RequireAuthenticated)],
)
async def get_user_by_id(request: Request, id: int):
    user = await User.get_user_by_id(id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return await UserResponseModel.from_user(user)
