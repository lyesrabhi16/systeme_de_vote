from fastapi import APIRouter, Request, Depends
from app.middlewares.auth_middleware import AUTH_MIDDLEWARE
from app.models import User, Vote
from loguru import logger

router = APIRouter()


@router.get(
    "/attributed",
    operation_id="get_attributed_votes",
    response_model=list[Vote],
    dependencies=[
        Depends(AUTH_MIDDLEWARE.RequireAuthenticated),
    ],
)
async def get_attributed_votes(request: Request):
    user = await User.get_authenticated_user(request)
    attributed_votes = map(lambda av: av.vote, user.attributed_votes)
    return list(attributed_votes)


@router.get(
    "/created",
    operation_id="get_created_votes",
    response_model=list[Vote],
    dependencies=[
        Depends(AUTH_MIDDLEWARE.RequireAuthenticated),
    ],
)
async def get_created_votes(request: Request):
    user = await User.get_authenticated_user(request)
    return user.created_votes


@router.get(
    "/voted",
    operation_id="get_already_voted_on_votes",
    response_model=list[Vote],
    dependencies=[
        Depends(AUTH_MIDDLEWARE.RequireAuthenticated),
    ],
)
async def get_already_voted_on_votes(request: Request):
    user = await User.get_authenticated_user(request)
    voted_votes = map(lambda b: b.vote, user.bulletins)
    return list(voted_votes)


@router.get(
    "/available",
    operation_id="get_available_votes",
    response_model=list[Vote],
    dependencies=[
        Depends(AUTH_MIDDLEWARE.RequireAuthenticated),
    ],
)
async def get_available_votes(request: Request):
    user = await User.get_authenticated_user(request)
    voted_vote_ids = {vote.id for vote in map(lambda b: b.vote, user.bulletins)}

    available_votes = [
        attributed_vote.vote
        for attributed_vote in user.attributed_votes
        if attributed_vote.vote.id not in voted_vote_ids
    ]

    logger.debug(f"User {user.username} has {len(available_votes)} available votes.")

    return available_votes
