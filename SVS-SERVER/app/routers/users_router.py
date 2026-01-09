from fastapi import APIRouter, Query, Request, Depends, HTTPException
from app.middlewares.auth_middleware import AUTH_MIDDLEWARE
from app.middlewares.routes_guards_middleware import ROUTES_GUARDS_MIDDLEWARE
from app.models import User
from app.models.user import UserCreationModel, UserResponseModel, UserUpdateModel
from loguru import logger
from app.models.error_codes import ERROR_CODES
from fastcrud import FastCRUD, PaginatedListResponse
from app.utils import transformers
from app.utils.utils import paginate

router = APIRouter()
crud = FastCRUD(model=User)


@router.post(
    "/",
    operation_id="create_user",
    response_model=UserResponseModel,
    dependencies=[
        Depends(AUTH_MIDDLEWARE.RequireAuthenticated),
        Depends(ROUTES_GUARDS_MIDDLEWARE.AdminOnly),
    ],
)
async def create_user(
    request: Request, user_data: UserCreationModel
) -> UserResponseModel:
    logger.debug(
        f"Admin {request.state.user.username} is attempting to create a new user."
    )
    user = User(
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        username=user_data.username,
        email=user_data.email,
        phone_number=user_data.phone_number,
        is_admin=user_data.is_admin,
    )
    await user.save()
    logger.debug(
        f"User {user.username} created successfully by admin {request.state.user.username}."
    )
    return await UserResponseModel.from_user(user)


@router.get(
    "/",
    operation_id="get_users",
    response_model=PaginatedListResponse[UserResponseModel],
    dependencies=[
        Depends(AUTH_MIDDLEWARE.RequireAuthenticated),
        Depends(ROUTES_GUARDS_MIDDLEWARE.AdminOnly),
    ],
)
async def admin_get_users(
    request: Request,
    page: int = 1,
    per_page: int = Query(default=10, min=1, max=100),
):

    return await paginate(
        crud=crud,
        page=page,
        per_page=per_page,
        transformer=transformers.User_to_UserResponseModel,
        is_admin=False,
    )


@router.get(
    "/admin/:id",
    operation_id="admin_get_user_by_id",
    response_model=User,
    dependencies=[
        Depends(AUTH_MIDDLEWARE.RequireAuthenticated),
        Depends(ROUTES_GUARDS_MIDDLEWARE.AdminOnly),
    ],
)
async def admin_get_user_by_id(request: Request, id: int):
    user = await User.get_user_by_id(id)
    if not user:
        raise HTTPException(status_code=404, detail=ERROR_CODES.NOT_FOUND)
    return user


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


@router.delete(
    "/admin/:id",
    operation_id="admin_delete_user",
    response_model=dict,
    dependencies=[
        Depends(AUTH_MIDDLEWARE.RequireAuthenticated),
        Depends(ROUTES_GUARDS_MIDDLEWARE.AdminOnly),
    ],
)
async def admin_delete_user(request: Request, id: int):
    user = await User.get_user_by_id(id)
    if not user:
        raise HTTPException(status_code=404, detail=ERROR_CODES.NOT_FOUND)
    await user.delete()
    logger.info(
        f"Admin {request.state.user.username} deleted user {user.username} (ID: {user.id})"
    )
    return {"detail": "User deleted successfully"}


@router.put(
    "/admin/:id",
    operation_id="admin_update_user",
    response_model=User,
    dependencies=[
        Depends(AUTH_MIDDLEWARE.RequireAuthenticated),
        Depends(ROUTES_GUARDS_MIDDLEWARE.AdminOnly),
    ],
)
async def admin_update_user(
    request: Request, id: int, user_data: UserUpdateModel
) -> User:
    user = await User.get_user_by_id(id)
    if not user:
        raise HTTPException(status_code=404, detail=ERROR_CODES.NOT_FOUND)

    user.first_name = user_data.first_name
    user.last_name = user_data.last_name
    user.username = user_data.username
    user.email = user_data.email
    user.phone_number = user_data.phone_number
    user.is_admin = user_data.is_admin
    user.is_active = user_data.is_active
    user.verified_email = user_data.verified_email
    user.verified_phone_number = user_data.verified_phone_number

    if user_data.request_reset_password:
        logger.info(
            f"Admin {request.state.user.username} requested password reset for user {user.username} (ID: {user.id})"
        )
        user.password = None  # This will force the user to reset their password
    elif user_data.password:
        user.set_password(user_data.password)

    await user.save()
    logger.info(
        f"Admin {request.state.user.username} updated user {user.username} (ID: {user.id})"
    )
    return user
