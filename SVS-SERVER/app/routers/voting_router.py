from fastapi import APIRouter, Request, Depends, HTTPException
from app.middlewares.auth_middleware import AUTH_MIDDLEWARE
from app.models import User, Vote, response_models
from app.models.vote import FinishedVoteResponseModel
from app.models.vote_util_models import FullVoteResponseModel, VoteResultsModel
from app.models.voting_models import VoteInputData
from loguru import logger
from app.models.error_codes import ERROR_CODES
from app.utils import vote_utils

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
    logger.debug(f"User {user.username} voted vote IDs: {voted_vote_ids}")
    finished_votes = set()
    for id in voted_vote_ids:
        finished_vote: FinishedVoteResponseModel | None = (
            await FinishedVoteResponseModel.from_vote_id(id)
        )
        if finished_vote:
            finished_vote.user_has_voted = True
            finished_votes.add(finished_vote)
    for av in user.attributed_votes:
        if av.vote.is_vote_finished():
            finished_vote = await FinishedVoteResponseModel.from_vote_id(av.vote.id)
            if finished_vote and av.vote.id in voted_vote_ids:
                continue  # Already added
            finished_votes.add(finished_vote)

    logger.debug(
        f"User {user.username} has {len(finished_votes)} finished votes. {finished_votes}"
    )

    return finished_votes


@router.get(
    "/{vote_id}/",
    operation_id="get_vote_by_id",
    response_model=FullVoteResponseModel,
    dependencies=[
        Depends(AUTH_MIDDLEWARE.RequireAuthenticated),
    ],
)
async def get_vote_by_id(vote_id: int, request: Request):
    user = await User.get_authenticated_user(request)
    fullVote = await FullVoteResponseModel.from_vote_id(vote_id, user)
    if not fullVote:
        logger.warning(f"Vote with id {vote_id} not found.")
        raise HTTPException(status_code=404, detail=ERROR_CODES.NOT_FOUND)

    finishedVote = fullVote.vote
    if finishedVote.vote not in user.created_votes and finishedVote.vote.id not in map(
        lambda av: av.vote.id, user.attributed_votes
    ):
        logger.warning(
            f"User {user.username} tried to access vote {vote_id} without permission."
        )
        raise HTTPException(status_code=403, detail=ERROR_CODES.FORBIDDEN)
    return fullVote


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


@router.post(
    "/{vote_id}/",
    operation_id="vote",
    response_model=response_models.MessageResponse,
    dependencies=[
        Depends(AUTH_MIDDLEWARE.RequireAuthenticated),
    ],
)
async def vote(
    request: Request,
    vote_id: int,
    data: VoteInputData,
):
    user = await User.get_authenticated_user(request)
    vote = await Vote.get_by_id(vote_id)
    if not vote:
        logger.warning(f"Vote with id {vote_id} not found.")
        raise HTTPException(status_code=404, detail=ERROR_CODES.NOT_FOUND)

    if vote.is_vote_finished():
        logger.warning(f"Vote with id {vote_id} is already finished.")
        raise HTTPException(status_code=400, detail=ERROR_CODES.VOTE_FINISHED)

    if await user.has_voted_on(vote):
        logger.warning(f"User {user.username} has already voted on vote {vote_id}.")
        raise HTTPException(status_code=400, detail=ERROR_CODES.ALREADY_VOTED)

    await user.vote_on(vote, data)
    return response_models.MessageResponse(message="Vote recorded successfully.")


@router.get(
    "/result/{vote_id}/",
    operation_id="get_vote_result",
    response_model=FinishedVoteResponseModel,
    dependencies=[
        Depends(AUTH_MIDDLEWARE.RequireAuthenticated),
    ],
)
async def get_vote_result(vote_id: int, request: Request):
    user = await User.get_authenticated_user(request)
    finishedVote = await FinishedVoteResponseModel.from_vote_id(vote_id)
    if not finishedVote:
        logger.warning(f"Vote with id {vote_id} not found.")
        raise HTTPException(status_code=404, detail=ERROR_CODES.NOT_FOUND)

    if finishedVote.vote not in user.created_votes and finishedVote.vote.id not in map(
        lambda av: av.vote.id, user.attributed_votes
    ):
        logger.warning(
            f"User {user.username} tried to access vote result {vote_id} without permission."
        )
        raise HTTPException(status_code=403, detail=ERROR_CODES.FORBIDDEN)
    return finishedVote


@router.get(
    "/count/{vote_id}/",
    operation_id="get_vote_count",
    response_model=VoteResultsModel,
    dependencies=[
        Depends(AUTH_MIDDLEWARE.RequireAuthenticated),
    ],
)
async def get_vote_count(vote_id: int, request: Request):
    user = await User.get_authenticated_user(request)
    vote = await Vote.get_by_id(vote_id)

    if not vote:
        logger.warning(f"Vote with id {vote_id} not found.")
        raise HTTPException(status_code=404, detail=ERROR_CODES.NOT_FOUND)

    if user.is_admin is False:
        logger.warning(
            f"User {user.username} tried to access vote count {vote_id} without permission."
        )
        raise HTTPException(status_code=403, detail=ERROR_CODES.FORBIDDEN)
    count, failures = await vote_utils.get_vote_count(vote_id, user)
    return VoteResultsModel(
        candidate_results=count,
        count_failures=failures,
        abstention_count=len(vote.attributed_users) - sum(count.values()),
        voter_count=len(vote.bulletins),
    )
