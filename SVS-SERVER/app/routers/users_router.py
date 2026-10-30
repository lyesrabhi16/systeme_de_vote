from fastapi import APIRouter, Query, Request, Depends, HTTPException
from app.middlewares.auth_middleware import AUTH_MIDDLEWARE
from app.middlewares.routes_guards_middleware import ROUTES_GUARDS_MIDDLEWARE
from app.models import User
from app.models.user import AdminUserResponseModel, UserCreationModel, UserResponseModel, UserUpdateModel
from loguru import logger
from app.models.error_codes import ERROR_CODES
from fastcrud import FastCRUD, PaginatedListResponse
from app.utils import transformers
from app.utils.response_utils import paginate
from sqlalchemy.exc import IntegrityError

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
async def create_user(request: Request, user_data: UserCreationModel):
    logger.debug(
        f"Admin {request.state.user.username} is attempting to create a new user."
    )
    user = User(
        first_name=user_data.first_name.capitalize().strip(),
        last_name=user_data.last_name.upper().strip(),
        username=user_data.username.lower().strip(),
        email=user_data.email.lower().strip(),
        phone_number=user_data.phone_number,
        is_admin=user_data.is_admin,
        authority=user_data.authority,
        requested_password_reset=False if user_data.password else True,
    )
    if user_data.password:
        user.set_password(user_data.password)

    try:
        await user.save()
        logger.debug(
            f"User {user.username} created successfully by admin {request.state.user.username}."
        )
        return await UserResponseModel.from_user(user)
    except IntegrityError as e:
        logger.error(f"IntegrityError while creating user: {e}")
        if "user_email_key" in str(e.orig):
            raise HTTPException(
                status_code=409,
                detail=ERROR_CODES.EMAIL_ALREADY_EXISTS,
            )
        elif "user_phone_number_key" in str(e.orig):
            raise HTTPException(
                status_code=409,
                detail=ERROR_CODES.PHONE_NUMBER_ALREADY_EXISTS,
            )
        elif "user_username_key" in str(e.orig):
            raise HTTPException(
                status_code=409,
                detail=ERROR_CODES.USERNAME_ALREADY_EXISTS,
            )
        else:
            raise HTTPException(
                status_code=500,
                detail=ERROR_CODES.INTERNAL_SERVER_ERROR,
            )


@router.get(
    "/",
    operation_id="get_users",
    response_model=PaginatedListResponse[UserResponseModel],
    dependencies=[
        Depends(AUTH_MIDDLEWARE.RequireAuthenticated),
        Depends(ROUTES_GUARDS_MIDDLEWARE.AdminOnly),
        Depends(ROUTES_GUARDS_MIDDLEWARE.InscriptionAuthorityOnly),
    ],
)
async def admin_get_users(
    request: Request,
    page: int = 1,
    per_page: int = Query(default=10, min=1, max=100),
    search: str | None = Query(default=None),
):

    return await paginate(
        crud=crud,
        page=page,
        per_page=per_page,
        transformer=transformers.User_to_UserResponseModel,
        is_admin=False,
        search=search,
        search_columns=["username", "email", "first_name", "last_name"],
        sort_columns=["id"],
        sort_orders=["asc"],
    )


@router.get(
    "/admin/{id}",
    operation_id="admin_get_user_by_id",
    response_model=AdminUserResponseModel,
    dependencies=[
        Depends(AUTH_MIDDLEWARE.RequireAuthenticated),
        Depends(ROUTES_GUARDS_MIDDLEWARE.AdminOnly),
        Depends(ROUTES_GUARDS_MIDDLEWARE.InscriptionAuthorityOnly),
    ],
)
async def admin_get_user_by_id(request: Request, id: int):
    user = await User.get_user_by_id(id)
    if not user:
        raise HTTPException(status_code=404, detail=ERROR_CODES.NOT_FOUND)
    return AdminUserResponseModel.from_user(user)


@router.get(
    "/{id}",
    operation_id="get_user_by_id",
    response_model=UserResponseModel,
    dependencies=[Depends(AUTH_MIDDLEWARE.RequireAuthenticated)],
)
async def get_user_by_id(request: Request, id: int):
    """The account of somebody (an administrator), or one's own: an email address and a phone number are not for everyone."""
    if not request.state.user.is_admin and request.state.user.id != id:
        raise HTTPException(status_code=403, detail=ERROR_CODES.FORBIDDEN)
    user = await User.get_user_by_id(id)
    if not user:
        raise HTTPException(status_code=404, detail=ERROR_CODES.NOT_FOUND)
    return await UserResponseModel.from_user(user)


@router.delete(
    "/admin/{id}",
    operation_id="admin_delete_user",
    response_model=dict,
    dependencies=[
        Depends(AUTH_MIDDLEWARE.RequireAuthenticated),
        Depends(ROUTES_GUARDS_MIDDLEWARE.AdminOnly),
        Depends(ROUTES_GUARDS_MIDDLEWARE.InscriptionAuthorityOnly),
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
    "/admin/{id}",
    operation_id="admin_update_user",
    response_model=AdminUserResponseModel,
    dependencies=[
        Depends(AUTH_MIDDLEWARE.RequireAuthenticated),
        Depends(ROUTES_GUARDS_MIDDLEWARE.AdminOnly),
        Depends(ROUTES_GUARDS_MIDDLEWARE.InscriptionAuthorityOnly),
    ],
)
async def admin_update_user(request: Request, id: int, user_data: UserUpdateModel) -> AdminUserResponseModel:
    user = await User.get_user_by_id(id)
    if not user:
        raise HTTPException(status_code=404, detail=ERROR_CODES.NOT_FOUND)

    for attr in [
        "first_name",
        "last_name",
        "username",
        "email",
        "phone_number",
        "is_admin",
        "authority",
        "is_active",
        "authority",
        "verified_email",
        "verified_phone_number",
    ]:
        if getattr(user_data, attr) is not None:
            setattr(user, attr, getattr(user_data, attr))

    if user_data.request_password_reset:
        logger.info(
            f"Admin {request.state.user.username} requested password reset for user {user.username} (ID: {user.id})"
        )
        user.requested_password_reset = True
    elif user_data.password:
        user.set_password(user_data.password)

    await user.save()
    logger.info(
        f"Admin {request.state.user.username} updated user {user.username} (ID: {user.id})"
    )
    return AdminUserResponseModel.from_user(user)
