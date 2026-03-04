from fastapi import APIRouter, Depends, Query, HTTPException
from sqlmodel import SQLModel, select
from app.db import db
from app.middlewares.routes_guards_middleware import ROUTES_GUARDS_MIDDLEWARE
from app.middlewares.auth_middleware import AUTH_MIDDLEWARE
from app.models.messages import Messages
from app.models.user import UserResponseModel
from fastcrud import FastCRUD, PaginatedListResponse
from app.models import User, response_models, Bulletin, Vote, AttributedVote
from app.models.vote_util_models import VoteWithCreatorResponseModel
from app.utils.response_utils import paginate
from app.utils import transformers
from app.models.error_codes import ERROR_CODES
from app.utils import auth_utils, smtp_utils
from app.db.db import get_db_session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, case, and_, text, select
import threading
from datetime import datetime
from app.models.vote_util_models import FullVoteResponseModel


router = APIRouter()
crud = FastCRUD(model=User)
votes_crud = FastCRUD(model=Vote)


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


class ParticipationDataResponseModel(SQLModel):
    total_votes: int
    total_abstain: int
    no_participation: int


class VoteStatusPerMonthResponseModel(SQLModel):
    month: str
    upcoming: int
    ongoing: int
    finished: int


class UserGrowthPerMonthResponseModel(SQLModel):
    month: str
    new_users_count: int
    total_users: int


class VotesPerMonthResponseModel(SQLModel):
    month: str
    vote_count: int


class DashboardResponseModel(SQLModel):
    lastFinishedVote: FullVoteResponseModel | None
    upcomingVotes: list[VoteWithCreatorResponseModel]
    ongoingVotes: list[VoteWithCreatorResponseModel]
    participationData: ParticipationDataResponseModel
    votesPerMonth: list[VotesPerMonthResponseModel]
    userGrowthPerMonth: list[UserGrowthPerMonthResponseModel]
    votesStatusPerMonth: list[VoteStatusPerMonthResponseModel]


@router.get(
    "/dashboard",
    operation_id="admin_dashboard",
    response_model=DashboardResponseModel,
    dependencies=[
        Depends(AUTH_MIDDLEWARE.RequireAuthenticated),
        Depends(ROUTES_GUARDS_MIDDLEWARE.AdminOnly),
    ],
)
async def admin_dashboard(db: AsyncSession = Depends(get_db_session)):
    votesPerMonth = await getVotesPerMonth(db)
    userGrowthPerMonth = await getUserGrowth(db)
    votesStatusPerMonth = await getVotesStatusPerMonth(db)
    participationData = await getParticipationData(db)

    # Upcoming votes
    upcoming_votes_stmt = (
        select(Vote)
        .where(Vote.start_date > datetime.utcnow())
        .order_by(Vote.start_date.asc())
        .limit(3)
    )
    upcomingVotes = (await db.execute(upcoming_votes_stmt)).scalars().all()
    upcomingVotes = [
        await VoteWithCreatorResponseModel.from_vote_id(vote.id)
        for vote in upcomingVotes
    ]

    # Ongoing votes
    ongoing_votes_stmt = (
        select(Vote)
        .where(
            and_(
                Vote.start_date <= datetime.utcnow(),
                Vote.end_date >= datetime.utcnow(),
            )
        )
        .order_by(Vote.start_date.asc())
        .limit(3)
    )
    ongoingVotes = (await db.execute(ongoing_votes_stmt)).scalars().all()
    ongoingVotes = [
        await VoteWithCreatorResponseModel.from_vote_id(vote.id)
        for vote in ongoingVotes
    ]

    last_finished_vote = (
        select(Vote)
        .where(Vote.end_date < datetime.utcnow())
        .order_by(Vote.end_date.desc())
        .limit(1)
    )
    last_finished_vote_result = (await db.execute(last_finished_vote)).scalars().first()
    last_vote = None
    if last_finished_vote_result is not None:
        last_vote = await FullVoteResponseModel.from_vote_id(
            last_finished_vote_result.id
        )
    return {
        "lastFinishedVote": last_vote,
        "upcomingVotes": upcomingVotes,
        "ongoingVotes": ongoingVotes,
        "participationData": participationData,
        "votesPerMonth": votesPerMonth,
        "userGrowthPerMonth": userGrowthPerMonth,
        "votesStatusPerMonth": votesStatusPerMonth,
    }


async def getParticipationData(db: AsyncSession):
    """
    Returns the total number of votes cast, total abstentions,
    and number of users who never participated.
    """

    # Total votes cast (bulletins)
    total_votes_stmt = select(func.count()).select_from(Bulletin)
    result = await db.execute(total_votes_stmt)
    total_votes = result.scalar() or 0

    # Total abstentions
    # User has an attributed vote, vote is finished, but user_has_voted is False
    abstain_stmt = (
        select(func.count())
        .select_from(AttributedVote)
        .join(Vote, AttributedVote.vote_id == Vote.id)
        .where(Vote.end_date < func.now())
        .where(AttributedVote.user_has_voted.is_(False))  # abstained
    )
    result = await db.execute(abstain_stmt)
    total_abstain = result.scalar() or 0

    # Users who never participated (all his attributed_votes.user_has_voted are false or he has no attributed votes at all)
    # Subquery: users who have at least one voted attributed_vote
    subq = (
        select(AttributedVote.user_id)
        .where(AttributedVote.user_has_voted.is_(True))
        .distinct()
    ).subquery()
    no_participation_stmt = select(func.count(User.id)).where(
        ~User.id.in_(select(subq.c.user_id))
    )

    result = await db.execute(no_participation_stmt)
    no_participation = result.scalar() or 0
    return {
        "total_votes": total_votes,
        "total_abstain": total_abstain,
        "no_participation": no_participation,
    }


async def getVotesStatusPerMonth(db: AsyncSession):
    """
    Returns a list of months with counts of upcoming, ongoing, and finished votes.
    Upcoming: votes starting in the month
    Ongoing: votes active during the month
    Finished: votes ending in the month
    """

    # Extract year-month as string 'YYYY-MM'
    month_expr = func.to_char(Vote.start_date, "YYYY-MM")

    # Upcoming: votes starting in the month
    upcoming_count = func.count(
        case((func.to_char(Vote.start_date, "YYYY-MM") == month_expr, 1))
    )

    # Finished: votes ending in the month
    finished_count = func.count(
        case((func.to_char(Vote.end_date, "YYYY-MM") == month_expr, 1))
    )

    # Ongoing: votes overlapping the month
    ongoing_count = func.count(
        case(
            (
                and_(
                    Vote.start_date
                    <= func.date_trunc("month", Vote.start_date)
                    + text("interval '1 month' - interval '1 second'"),
                    Vote.end_date >= func.date_trunc("month", Vote.start_date),
                ),
                1,
            )
        )
    )

    stmt = (
        select(
            month_expr.label("month"),
            upcoming_count.label("upcoming"),
            ongoing_count.label("ongoing"),
            finished_count.label("finished"),
        )
        .group_by(month_expr)
        .order_by(month_expr)
    )

    result = await db.execute(stmt)
    votesStatusPerMonth = [dict(row) for row in result.mappings()]
    return votesStatusPerMonth


async def getUserGrowth(db: AsyncSession):
    """
    Returns number of users registered during the month and the total number of users up to that month.
    """
    # Expression for month in YYYY-MM format
    month_expr = func.to_char(func.date_trunc("month", User.created_at), "YYYY-MM")

    # Step 1: get monthly user counts
    statement = (
        select(month_expr.label("month"), func.count().label("new_users_count"))
        .group_by(month_expr)
        .order_by(month_expr)
    )
    result = await db.execute(statement)
    monthly_counts = [dict(row) for row in result.mappings()]

    # Step 2: compute cumulative totals
    total = 0
    for row in monthly_counts:
        total += row["new_users_count"]
        row["total_users"] = total

    return monthly_counts


async def getVotesPerMonth(db: AsyncSession):
    month_expr = func.to_char(func.date_trunc("month", Vote.start_date), "YYYY-MM")

    statement = (
        select(month_expr.label("month"), func.count().label("vote_count"))
        .select_from(Vote)
        .group_by(month_expr)
        .order_by(month_expr)
    )
    result = await db.execute(statement)
    votesPerMonth = [dict(row) for row in result.mappings()]

    return votesPerMonth
