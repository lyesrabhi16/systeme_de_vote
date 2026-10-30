from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastcrud import FastCRUD, PaginatedListResponse
from loguru import logger
from sqlalchemy import and_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.db.db import get_db_session
from app.middlewares.auth_middleware import AUTH_MIDDLEWARE
from app.middlewares.routes_guards_middleware import ROUTES_GUARDS_MIDDLEWARE
from app.models import User, Vote, response_models
from app.models.admin_util_models import DashboardResponseModel
from app.models.error_codes import ERROR_CODES
from app.models.messages import Messages
from app.models.types import utcnow
from app.models.user import AuthorityEnum, UserResponseModel
from app.models.vote_util_models import FullVoteResponseModel, VoteWithCreatorResponseModel
from app.utils import auth_utils, smtp_utils, transformers
from app.utils.admin_utils import (
    getParticipationData,
    getUserActivityRepartition,
    getUserGrowth,
    getUserRoleRepartition,
    getVotesPerMonth,
    getVotesStatusPerMonth,
)
from app.utils.response_utils import paginate

router = APIRouter()
crud = FastCRUD(model=User)
votes_crud = FastCRUD(model=Vote)


@router.get(
    "/",
    operation_id="get_admins",
    response_model=PaginatedListResponse[UserResponseModel],
    dependencies=[
        Depends(AUTH_MIDDLEWARE.RequireAuthenticated),
        Depends(ROUTES_GUARDS_MIDDLEWARE.AdminOnly),
        Depends(ROUTES_GUARDS_MIDDLEWARE.InscriptionAuthorityOnly),
    ],
)
async def get_admins(
    page: int = 1,
    per_page: int = Query(default=10, min=1, max=100),
    search: str | None = Query(default=None),
):

    return await paginate(
        crud=crud,
        page=page,
        per_page=per_page,
        transformer=transformers.User_to_UserResponseModel,
        search=search,
        search_columns=["username", "email", "first_name", "last_name"],
        sort_columns=["id"],
        sort_orders=["asc"],
        is_admin=True,
    )


@router.post(
    "/send-verification-email",
    operation_id="send_verification_email",
    dependencies=[
        Depends(AUTH_MIDDLEWARE.RequireAuthenticated),
        Depends(ROUTES_GUARDS_MIDDLEWARE.AdminOnly),
        Depends(ROUTES_GUARDS_MIDDLEWARE.InscriptionAuthorityOnly),
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


@router.get(
    "/dashboard",
    operation_id="admin_dashboard",
    response_model=DashboardResponseModel,
    dependencies=[
        Depends(AUTH_MIDDLEWARE.RequireAuthenticated),
        Depends(ROUTES_GUARDS_MIDDLEWARE.AdminOnly),
    ],
)
async def admin_dashboard(request: Request, db: AsyncSession = Depends(get_db_session)):
    user = await User.get_authenticated_user(request)
    if user.authority == AuthorityEnum.Inscription:
        return await admin_inscription_authority_dashboard(db)
    elif user.authority == AuthorityEnum.Vote:
        return await admin_vote_authority_dashboard(db)
    else:
        logger.error(f"User {user.username} has invalid authority {user.authority} for admin dashboard access")
        raise HTTPException(status_code=403, detail=ERROR_CODES.ADMIN_PRIVILEGES_REQUIRED)


async def admin_inscription_authority_dashboard(db: AsyncSession):
    userGrowthPerMonth = await getUserGrowth(db)
    userRoleRepartition = await getUserRoleRepartition(db)
    userActivityRepartition = await getUserActivityRepartition(db)
    nbr_users = (await db.execute(select(func.count(User.id)).where(User.is_admin.is_(False)))).one()[0]
    nbr_admins = (await db.execute(select(func.count(User.id)).where(User.is_admin.is_(True)))).one()[0]
    nbr_inscription_authority = (
        await db.execute(select(func.count(User.id)).where(User.authority == AuthorityEnum.Inscription))
    ).one()[0]
    nbr_vote_authority = (
        await db.execute(select(func.count(User.id)).where(User.authority == AuthorityEnum.Vote))
    ).one()[0]
    return DashboardResponseModel(
        userGrowthPerMonth=userGrowthPerMonth,
        userRoleRepartition=userRoleRepartition,
        userActivityRepartition=userActivityRepartition,
        nbr_users=nbr_users,
        nbr_admins=nbr_admins,
        nbr_inscription_authority=nbr_inscription_authority,
        nbr_vote_authority=nbr_vote_authority,
    )


async def admin_vote_authority_dashboard(db: AsyncSession):
    votesPerMonth = await getVotesPerMonth(db)
    votesStatusPerMonth = await getVotesStatusPerMonth(db)
    participationData = await getParticipationData(db)

    # Upcoming votes
    upcoming_votes_stmt = select(Vote).where(Vote.start_date > utcnow()).order_by(Vote.start_date.asc()).limit(3)
    upcomingVotes = (await db.execute(upcoming_votes_stmt)).scalars().all()
    upcomingVotes = [await VoteWithCreatorResponseModel.from_vote_id(vote.id) for vote in upcomingVotes]

    # Ongoing votes
    ongoing_votes_stmt = (
        select(Vote)
        .where(
            and_(
                Vote.start_date <= utcnow(),
                Vote.end_date >= utcnow(),
            )
        )
        .order_by(Vote.start_date.asc())
        .limit(3)
    )
    ongoingVotes = (await db.execute(ongoing_votes_stmt)).scalars().all()
    ongoingVotes = [await VoteWithCreatorResponseModel.from_vote_id(vote.id) for vote in ongoingVotes]

    last_finished_vote = select(Vote).where(Vote.end_date < utcnow()).order_by(Vote.end_date.desc()).limit(1)
    last_finished_vote_result = (await db.execute(last_finished_vote)).scalars().first()
    last_vote = None
    if last_finished_vote_result is not None:
        last_vote = await FullVoteResponseModel.from_vote_id(last_finished_vote_result.id)
    return {
        "lastFinishedVote": last_vote,
        "upcomingVotes": upcomingVotes,
        "ongoingVotes": ongoingVotes,
        "participationData": participationData,
        "votesPerMonth": votesPerMonth,
        "votesStatusPerMonth": votesStatusPerMonth,
    }
