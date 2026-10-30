import asyncio
import json

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastcrud import FastCRUD, PaginatedListResponse, paginated_response
from loguru import logger

from app.middlewares.auth_middleware import AUTH_MIDDLEWARE
from app.middlewares.routes_guards_middleware import ROUTES_GUARDS_MIDDLEWARE
from app.models import Bulletin, User, Vote, auth_models, response_models
from app.models.attributed_votes import AttributedVote
from app.models.error_codes import ERROR_CODES
from app.models.types import utcnow
from app.models.vote import AlreadyVoted, DuplicateBallot, VoteResponseModel
from app.models.vote_util_models import (
    FinishedVoteResponseModel,
    FullVoteResponseModel,
    VoteCreationModel,
    VoteResultsModel,
    VoteUpdateModel,
)
from app.models.voting_models import VoteAuditModel, VoteCastData, VoteCastResponseModel
from app.utils import response_utils, smtp_utils, vote_utils

router = APIRouter()
crud = FastCRUD(model=Vote)
bulletins_crud = FastCRUD(model=Bulletin)


@router.get(
    "/attributed",
    operation_id="get_attributed_votes",
    response_model=list[VoteResponseModel],
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
    response_model=list[VoteResponseModel],
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
    response_model=list[VoteResponseModel],
    dependencies=[
        Depends(AUTH_MIDDLEWARE.RequireAuthenticated),
    ],
)
async def get_already_voted_on_votes(request: Request):
    user = await User.get_authenticated_user(request)
    return [av.vote for av in user.attributed_votes if av.user_has_voted]


@router.get(
    "/available",
    operation_id="get_available_votes",
    response_model=list[VoteResponseModel],
    dependencies=[
        Depends(AUTH_MIDDLEWARE.RequireAuthenticated),
    ],
)
async def get_available_votes(request: Request):
    user = await User.get_authenticated_user(request)
    voted_vote_ids = {av.vote_id for av in user.attributed_votes if av.user_has_voted}
    logger.debug(f"User {user.username} voted vote IDs: {voted_vote_ids}")

    available_votes = [
        attributed_vote.vote
        for attributed_vote in user.attributed_votes
        if attributed_vote.vote.id not in voted_vote_ids
        and not attributed_vote.vote.is_vote_finished()
        and not attributed_vote.user_has_voted
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
    """The elections that are over and the ones the user voted in, with the user's own situation in each."""
    user = await User.get_authenticated_user(request)
    wanted = sorted({av.vote_id for av in user.attributed_votes if av.user_has_voted or av.vote.is_vote_finished()})
    finished = [await FinishedVoteResponseModel.from_vote_id(vote_id, user) for vote_id in wanted]
    return [f for f in finished if f is not None]


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
    vote = await Vote.get_by_id(vote_id)
    if vote is None:
        logger.warning(f"Vote with id {vote_id} not found.")
        raise HTTPException(status_code=404, detail=ERROR_CODES.NOT_FOUND)
    if not vote.is_visible_to(user):
        logger.warning(f"User {user.id} tried to access vote {vote_id} without permission.")
        raise HTTPException(status_code=403, detail=ERROR_CODES.FORBIDDEN)
    return await FullVoteResponseModel.from_vote_id(vote_id, user)


@router.get(
    "/",
    operation_id="get_all_votes",
    response_model=PaginatedListResponse[VoteResponseModel],
    dependencies=[
        Depends(AUTH_MIDDLEWARE.RequireAuthenticated),
    ],
)
async def get_all_votes(
    request: Request,
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=10, ge=1, le=100),
    search: str | None = Query(default=None),
):
    if request.state.user.is_admin:
        return await response_utils.paginate(
            crud=crud,
            page=page,
            per_page=per_page,
            transformer=None,
            search=search,
            schema_to_select=VoteResponseModel,
            search_columns=["title", "description"],
            sort_columns=["id"],
            sort_orders=["asc"],
        )
    user = await User.get_authenticated_user(request)
    # the elections of this person, each once, in the order of the administrators' list
    votes = {v.id: v for v in [*user.created_votes, *(av.vote for av in user.attributed_votes)]}
    matching = sorted(
        (
            v
            for v in votes.values()
            if not search or search.lower() in v.title.lower() or search.lower() in v.description.lower()
        ),
        key=lambda v: v.id,
    )
    return paginated_response(
        crud_data={"data": matching[(page - 1) * per_page : page * per_page], "total_count": len(matching)},
        page=page,
        items_per_page=per_page,
    )


@router.post(
    "/cast/{vote_id}",
    operation_id="cast_vote",
    response_model=VoteCastResponseModel,
    dependencies=[
        Depends(AUTH_MIDDLEWARE.RequireAuthenticated),
    ],
)
async def cast_vote(
    request: Request,
    vote_id: int,
    data: VoteCastData,
):
    user = await User.get_authenticated_user(request)
    vote = await Vote.get_by_id(vote_id)
    if not vote:
        logger.warning(f"Vote with id {vote_id} not found.")
        raise HTTPException(status_code=404, detail=ERROR_CODES.NOT_FOUND)
    av = await AttributedVote.get_by_ids(user_id=user.id, vote_id=vote_id)
    if av is None:
        logger.warning(f"User {user.id} is not attributed to vote {vote_id}.")
        raise HTTPException(status_code=403, detail=ERROR_CODES.NOT_ELIGIBLE)

    if not vote.has_started():
        raise HTTPException(status_code=400, detail=ERROR_CODES.VOTE_NOT_STARTED)
    if vote.is_vote_finished():
        logger.warning(f"Vote with id {vote_id} is already finished.")
        raise HTTPException(status_code=400, detail=ERROR_CODES.VOTE_FINISHED)
    if av.user_has_voted:
        raise HTTPException(status_code=409, detail=ERROR_CODES.ALREADY_VOTED)

    # The whole ballot is checked before anything is recorded: a refused ballot does not use up the right to vote.
    # (A few modular exponentiations per candidate: in a thread, or every other request would wait.)
    try:
        await asyncio.to_thread(
            vote_utils.check_ballot,
            vote_utils.load_public_key(vote.public_key),
            {candidate.id for candidate in vote.candidates},
            data,
        )
    except vote_utils.InvalidBallot as e:
        logger.warning(f"A ballot on vote {vote_id} was refused: {e}")
        raise HTTPException(status_code=400, detail=ERROR_CODES.INVALID_BALLOT) from None

    try:
        unique_code = await vote.register_vote(user, data)
    except AlreadyVoted:
        raise HTTPException(status_code=409, detail=ERROR_CODES.ALREADY_VOTED) from None
    except DuplicateBallot:
        raise HTTPException(status_code=400, detail=ERROR_CODES.INVALID_BALLOT) from None
    # send the receipt by email to the user
    smtp_utils.send_in_thread(smtp_utils.send_vote_cast_confirmation_email)(
        to_email=[user.email],
        unique_code=unique_code,
        vote_title=vote.title,
        vote_id=vote.id,
    )
    return VoteCastResponseModel(unique_code=unique_code)


@router.get(
    "/bulletins/{vote_id}/",
    operation_id="get_vote_bulletins",
    response_model=PaginatedListResponse[Bulletin],
    dependencies=[],
)
async def get_public_vote_bulletins(
    vote_id: int,
    page: int = Query(1, ge=1),
    items_per_page: int = Query(10, ge=1, le=100),
):
    """The bulletin board: every ballot of the election, public, so that anyone can check them (see app/utils/audit.py)."""
    vote = await Vote.get_by_id(vote_id)
    if not vote:
        logger.warning(f"Vote with id {vote_id} not found.")
        raise HTTPException(status_code=404, detail=ERROR_CODES.NOT_FOUND)

    return await response_utils.paginate(
        crud=bulletins_crud,
        page=page,
        per_page=items_per_page,
        sort_columns=["id"],
        sort_orders=["asc"],
        vote_id=vote_id,
    )


@router.get(
    "/audit/{vote_id}/",
    operation_id="get_vote_audit",
    response_model=VoteAuditModel,
)
async def get_vote_audit(vote_id: int):
    """What is needed to check the count of a finished election against the bulletin board. Public, like the board."""
    vote = await Vote.get_by_id(vote_id)
    if not vote:
        raise HTTPException(status_code=404, detail=ERROR_CODES.NOT_FOUND)
    if not vote.has_been_counted or not vote.encrypted_tally or not vote.tally_proof:
        raise HTTPException(status_code=400, detail=ERROR_CODES.VOTE_NOT_FINISHED)
    return VoteAuditModel(
        public_key=vote.public_key,
        counts={candidate.id: candidate.vote_count or 0 for candidate in vote.candidates},
        encrypted_tally=json.loads(vote.encrypted_tally),
        tally_proof=json.loads(vote.tally_proof),
    )


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
    vote = await Vote.get_by_id(vote_id)
    if vote is None:
        logger.warning(f"Vote with id {vote_id} not found.")
        raise HTTPException(status_code=404, detail=ERROR_CODES.NOT_FOUND)
    if not vote.is_visible_to(user):
        logger.warning(f"User {user.id} tried to access vote result {vote_id} without permission.")
        raise HTTPException(status_code=403, detail=ERROR_CODES.FORBIDDEN)
    return await FinishedVoteResponseModel.from_vote_id(vote_id, user)


@router.get(
    "/count/{vote_id}/",
    operation_id="get_vote_count",
    response_model=VoteResultsModel,
    dependencies=[
        Depends(AUTH_MIDDLEWARE.RequireAuthenticated),
        Depends(ROUTES_GUARDS_MIDDLEWARE.AdminOnly),
        Depends(ROUTES_GUARDS_MIDDLEWARE.VoteAuthorityOnly),
    ],
)
async def get_vote_count(vote_id: int):
    """Counts an election that is finished (the cron does it too, every minute): the same result each time."""
    vote = await Vote.get_by_id(vote_id)

    if not vote:
        logger.warning(f"Vote with id {vote_id} not found.")
        raise HTTPException(status_code=404, detail=ERROR_CODES.NOT_FOUND)

    count, failures = await vote_utils.get_vote_count(vote_id)  # 400 if it is not finished
    voted = sum(1 for av in vote.attributed_users if av.user_has_voted)
    return VoteResultsModel(
        candidate_results=count,
        count_failures=failures,
        abstention_count=len(vote.attributed_users) - voted,
        voter_count=voted,
    )


@router.post(
    "/",
    operation_id="create_vote",
    response_model=FullVoteResponseModel,
    dependencies=[
        Depends(AUTH_MIDDLEWARE.RequireAuthenticated),
        Depends(ROUTES_GUARDS_MIDDLEWARE.AdminOnly),
        Depends(ROUTES_GUARDS_MIDDLEWARE.VoteAuthorityOnly),
    ],
)
async def create_vote(
    request: Request,
    data: VoteCreationModel,
):
    user = await User.get_authenticated_user(request)
    vote = await data.save(creator_id=user.id)
    return vote


@router.post(
    "/check/{vote_id}/user-voted",
    operation_id="check_if_user_voted_on_vote",
    response_model=response_models.BooleanResponse,
    dependencies=[
        Depends(AUTH_MIDDLEWARE.RequireAuthenticated),
    ],
)
async def check_if_user_voted_on_vote(
    vote_id: int, data: auth_models.RequiredTokenInput, request: Request
):
    user = await User.get_authenticated_user(request)
    vote = await Vote.get_by_id(vote_id)

    if not vote:
        logger.warning(f"Vote with id {vote_id} not found.")
        raise HTTPException(status_code=404, detail=ERROR_CODES.NOT_FOUND)

    has_voted = await user.has_voted_on(vote, token=data.token)
    return response_models.BooleanResponse(result=has_voted)


@router.put(
    "/{vote_id}/",
    operation_id="update_vote",
    response_model=FullVoteResponseModel,
    dependencies=[
        Depends(AUTH_MIDDLEWARE.RequireAuthenticated),
        Depends(ROUTES_GUARDS_MIDDLEWARE.AdminOnly),
        Depends(ROUTES_GUARDS_MIDDLEWARE.VoteAuthorityOnly),
    ],
)
async def update_vote(
    vote_id: int,
    data: VoteUpdateModel,
):
    vote = await Vote.get_by_id(vote_id)

    if not vote:
        logger.warning(f"Vote with id {vote_id} not found.")
        raise HTTPException(status_code=404, detail=ERROR_CODES.NOT_FOUND)
    # check if vote is finished
    if vote.is_vote_finished():
        logger.warning(
            f"Vote with id {vote_id} is already finished and cannot be updated."
        )
        raise HTTPException(
            status_code=400, detail=ERROR_CODES.VOTE_FINISHED_CANNOT_UPDATE
        )
    # check if vote has started
    if vote.start_date and vote.start_date < utcnow():
        logger.warning(
            f"Vote with id {vote_id} has already started and cannot be updated."
        )
        raise HTTPException(
            status_code=400, detail=ERROR_CODES.VOTE_STARTED_CANNOT_UPDATE
        )
    updated_vote = await data.update(vote.id)
    logger.debug(
        f"Updated vote {vote_id} with data: {data.json()} {updated_vote.json()}"
    )
    return updated_vote


@router.delete(
    "/{vote_id}/",
    operation_id="delete_vote",
    response_model=response_models.MessageResponse,
    dependencies=[
        Depends(AUTH_MIDDLEWARE.RequireAuthenticated),
        Depends(ROUTES_GUARDS_MIDDLEWARE.AdminOnly),
        Depends(ROUTES_GUARDS_MIDDLEWARE.VoteAuthorityOnly),
    ],
)
async def delete_vote(vote_id: int):
    vote = await Vote.get_by_id(vote_id)

    if not vote:
        logger.warning(f"Vote with id {vote_id} not found.")
        raise HTTPException(status_code=404, detail=ERROR_CODES.NOT_FOUND)
    # check if vote is finished
    if vote.is_vote_finished():
        logger.warning(
            f"Vote with id {vote_id} is already finished and cannot be deleted."
        )
        raise HTTPException(
            status_code=400, detail=ERROR_CODES.VOTE_FINISHED_CANNOT_DELETE
        )
    # check if vote has started
    if vote.start_date and vote.start_date < utcnow():
        logger.warning(
            f"Vote with id {vote_id} has already started and cannot be deleted."
        )
        raise HTTPException(
            status_code=400, detail=ERROR_CODES.VOTE_STARTED_CANNOT_DELETE
        )
    await vote.delete()
    return response_models.MessageResponse(message="Vote deleted successfully.")
