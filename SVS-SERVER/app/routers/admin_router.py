from fastapi import APIRouter, Depends, Query, HTTPException
from app.middlewares.routes_guards_middleware import ROUTES_GUARDS_MIDDLEWARE
from app.middlewares.auth_middleware import AUTH_MIDDLEWARE
from app.models.messages import Messages
from app.models.user import UserResponseModel
from fastcrud import FastCRUD, PaginatedListResponse
from app.models import User, response_models
from app.utils.response_utils import paginate
from app.utils import transformers
from app.models.error_codes import ERROR_CODES
from app.utils import auth_utils, smtp_utils

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


@router.post(
    "/send-verification-email",
    operation_id="send_verification_email",
    dependencies=[
        Depends(AUTH_MIDDLEWARE.RequireAuthenticated),
        Depends(ROUTES_GUARDS_MIDDLEWARE.AdminOnly),
    ],
)
async def send_verification_email(user_id: int):
    user = await User.get_user_by_id(user_id)
    if not user or user is None:
        raise HTTPException(
            status_code=404,
            detail=ERROR_CODES.NOT_FOUND,
        )
    if user.id is None:
        raise HTTPException(
            status_code=400,
            detail=ERROR_CODES.INTERNAL_SERVER_ERROR,
        )
    # destroy previous OTPs
    await auth_utils.remove_otp(user.id)
    # create new OTP and re-send email
    otp = await auth_utils.create_otp(user.id)
    smtp_utils.send_in_thread(smtp_utils.send_connection_otp_email)(
        to_email=[user.email],
        otp_code=otp,
    )
    return response_models.MessageResponse(message=Messages.VERIFICATION_EMAIL_SENT)
