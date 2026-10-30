from sqlalchemy import and_, case, func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.attributed_votes import AttributedVote
from app.models.bulletin import Bulletin
from app.models.user import User
from app.models.vote import Vote


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


async def getUserRoleRepartition(db: AsyncSession):
    stmt = (
        select(User.authority, func.count().label("count"))
        .where(User.authority.isnot(None))
        .group_by(User.authority)
        .order_by(User.authority)
    )
    result = await db.execute(stmt)
    userRoleRepartition = {row.authority.value: row.count for row in result}
    return userRoleRepartition


async def getUserActivityRepartition(db: AsyncSession):
    # count is_active true vs false
    stmt = (
        select(User.is_active, func.count().label("count"))
        .group_by(User.is_active)
        .order_by(User.is_active)
    )
    result = await db.execute(stmt)
    userActivityRepartition = {
        "active" if row.is_active else "inactive": row.count for row in result
    }
    return userActivityRepartition
