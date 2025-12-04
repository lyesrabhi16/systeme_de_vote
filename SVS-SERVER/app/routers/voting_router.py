from fastapi import APIRouter, Request, Depends, HTTPException
from app.middlewares.auth_middleware import AUTH_MIDDLEWARE
from app.models import User, Vote
from app.models.vote import FinishedVoteResponseModel
from loguru import logger
from app.models.error_codes import ERROR_CODES

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
        and not attributed_vote.vote.is_vote_finished()
    ]

    logger.debug(f"User {user.username} has {len(available_votes)} available votes.")

    return available_votes


@router.get(
    "/finishedVotes",
    operation_id="get_finished_votes",
    response_model=list[FinishedVoteResponseModel],
    dependencies=[Depends(AUTH_MIDDLEWARE.RequireAuthenticated)],
)
async def get_finished_votes(request: Request):
    user = await User.get_authenticated_user(request)
    voted_vote_ids = {vote.id for vote in map(lambda b: b.vote, user.bulletins)}

    finished_votes = list(
        map(
            lambda av: FinishedVoteResponseModel(
                vote=av.vote,
                total_bulletins=len(list(av.vote.bulletins)),
                candidate_results={},
                abstention_count=0,
                voter_count=len({bulletin.user_id for bulletin in av.vote.bulletins}),
                user_has_voted=av.vote.id in voted_vote_ids,
            ),
            filter(lambda av: av.vote.is_vote_finished(), user.attributed_votes),
        )
    )

    logger.debug(
        f"User {user.username} has {len(finished_votes)} finished votes. {finished_votes}"
    )

    return finished_votes


@router.get(
    "/{vote_id}/",
    operation_id="get_vote_by_id",
    response_model=Vote,
    dependencies=[
        Depends(AUTH_MIDDLEWARE.RequireAuthenticated),
    ],
)
async def get_vote_by_id(vote_id: int, request: Request):
    user = await User.get_authenticated_user(request)
    vote = await Vote.get_by_id(vote_id)

    if not vote:
        logger.warning(f"Vote with id {vote_id} not found.")
        raise HTTPException(status_code=404, detail=ERROR_CODES.NOT_FOUND)

    if vote not in user.created_votes and vote not in map(
        lambda av: av.vote, user.attributed_votes
    ):
        logger.warning(
            f"User {user.username} tried to access vote {vote_id} without permission."
        )
        raise HTTPException(status_code=403, detail=ERROR_CODES.FORBIDDEN)
    return vote


@router.get(
    "/",
    operation_id="get_all_votes",
    response_model=list[Vote],
    dependencies=[
        Depends(AUTH_MIDDLEWARE.RequireAuthenticated),
    ],
)
async def get_all_votes(request: Request):
    user = await User.get_authenticated_user(request)
    votes = []
    votes.extend(user.created_votes)
    votes.extend(map(lambda av: av.vote, user.attributed_votes))
    return votes
