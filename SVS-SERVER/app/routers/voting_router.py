from fastapi import APIRouter, Query, Request, Depends, HTTPException
from fastcrud import FastCRUD, PaginatedListResponse, paginated_response
from app.middlewares.auth_middleware import AUTH_MIDDLEWARE
from app.middlewares.routes_guards_middleware import ROUTES_GUARDS_MIDDLEWARE
from app.models import User, Vote, Bulletin, response_models
from app.models.attributed_votes import AttributedVote
from app.models import auth_models
from app.models.vote_util_models import (
    FullVoteResponseModel,
    VoteResultsModel,
    FinishedVoteResponseModel,
    VoteCreationModel,
)
from app.models.voting_models import (
    BlindSignatureRequestModel,
    BlindSignatureResponseModel,
    VoteCastData,
)
from loguru import logger
from app.models.error_codes import ERROR_CODES
from app.utils import auth_utils, vote_utils, response_utils
from app.utils.response_utils import paginate

router = APIRouter()
crud = FastCRUD(model=Vote)
bulletins_crud = FastCRUD(model=Bulletin)


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

    finishedVote: FinishedVoteResponseModel = fullVote.vote
    if (
        user.is_admin is False
        and finishedVote.vote not in user.created_votes
        and finishedVote.vote.id
        not in map(lambda av: av.vote.id, user.attributed_votes)
    ):
        logger.warning(
            f"User {user.username} tried to access vote {vote_id} without permission."
        )
        raise HTTPException(status_code=403, detail=ERROR_CODES.FORBIDDEN)
    return fullVote


@router.get(
    "/",
    operation_id="get_all_votes",
    response_model=PaginatedListResponse[Vote] | list[Vote],
    dependencies=[
        Depends(AUTH_MIDDLEWARE.RequireAuthenticated),
    ],
)
async def get_all_votes(
    request: Request,
    page: int = Query(default=1),
    per_page: int = Query(default=10),
    search: str | None = Query(default=None),
):
    if request.state.user.is_admin:
        return await response_utils.paginate(
            crud=crud,
            page=page,
            per_page=per_page,
            transformer=None,
            search=search,
            search_columns=["title", "description"],
            sort_columns=["id"],
            sort_orders=["asc"],
        )
    user = await User.get_authenticated_user(request)
    votes = []
    votes.extend(user.created_votes)
    votes.extend(map(lambda av: av.vote, user.attributed_votes))
    return paginated_response(
        crud_data=({"data": votes, "total_count": len(votes)}),
        page=page,
        items_per_page=per_page,
    )


@router.post(
    "/{vote_id}/blind-signature/",
    operation_id="request_blind_signature",
    response_model=BlindSignatureResponseModel,
    dependencies=[
        Depends(AUTH_MIDDLEWARE.RequireAuthenticated),
    ],
)
async def request_blind_signature(
    request: Request,
    vote_id: int,
    data: BlindSignatureRequestModel,
):
    user = await User.get_authenticated_user(request)
    vote = await Vote.get_by_id(vote_id)

    if not vote:
        logger.warning(f"Vote with id {vote_id} not found.")
        raise HTTPException(status_code=404, detail=ERROR_CODES.NOT_FOUND)

    if vote.is_vote_finished():
        logger.warning(f"Vote with id {vote_id} is already finished.")
        raise HTTPException(status_code=400, detail=ERROR_CODES.VOTE_FINISHED)

    if user.id not in map(lambda av: av.user_id, vote.attributed_users):
        logger.warning(f"User {user.username} is not attributed to vote {vote_id}.")
        raise HTTPException(status_code=403, detail=ERROR_CODES.FORBIDDEN)

    attributed_vote = await AttributedVote.get_by_ids(user_id=user.id, vote_id=vote_id)

    if not attributed_vote:
        logger.error(
            f"AttributedVote not found for user {user.username} and vote {vote_id}."
        )
        raise HTTPException(status_code=404, detail=ERROR_CODES.NOT_FOUND)
    if attributed_vote.signature_issued:
        logger.warning(
            f"User {user.username} has already requested a blind signature for vote {vote_id}."
        )
        raise HTTPException(
            status_code=400, detail=ERROR_CODES.BLIND_SIGNATURE_ALREADY_ISSUED
        )

    blind_signature = await vote_utils.generate_blind_signature(
        auth_utils.decrypt_string(vote.encrypted_private_key),
        int(data.blinded_message),
    )
    logger.debug(
        f"Generated blind signature for user {user.username} on vote {vote_id}. Blind signature: {blind_signature}"
    )

    attributed_vote.signature_issued = True
    attributed_vote.blind_signature = str(blind_signature)
    attributed_vote.blinded_token_hash = auth_utils.hash_string(
        str(data.blinded_message)
    )
    await attributed_vote.save()
    b = BlindSignatureResponseModel(
        blind_signature=str(blind_signature),
        blinded_message=str(data.blinded_message),
    )
    logger.debug(
        f"Returning blind signature response for user {user.username} on vote {vote_id}: {b}"
    )
    return b


@router.post(
    "/cast/{vote_id}",
    operation_id="cast_vote",
    response_model=response_models.MessageResponse,
)
async def cast_vote(
    request: Request,
    vote_id: int,
    data: VoteCastData,
):
    vote = await Vote.get_by_id(vote_id)
    if not vote:
        logger.warning(f"Vote with id {vote_id} not found.")
        raise HTTPException(status_code=404, detail=ERROR_CODES.NOT_FOUND)

    if vote.is_vote_finished():
        logger.warning(f"Vote with id {vote_id} is already finished.")
        raise HTTPException(status_code=400, detail=ERROR_CODES.VOTE_FINISHED)

    # Verify the blind signature and token
    is_valid = await vote_utils.verify_blind_signature(
        vote_id=vote_id,
        blinded_token=int(data.token),
        blind_signature=int(data.signature),
        public_key=vote.public_key,
    )
    if not is_valid:
        logger.warning(f"Invalid blind signature or token for vote {vote_id} by user.")
        raise HTTPException(status_code=400, detail=ERROR_CODES.BAD_REQUEST)

    #
    await vote.register_vote(data)
    return response_models.MessageResponse(message="Vote recorded successfully.")


@router.get(
    "/bulletins/{vote_id}/",
    operation_id="get_vote_bulletins",
    response_model=PaginatedListResponse[Bulletin],
    dependencies=[],
)
async def get_public_vote_bulletins(
    vote_id: int,
    page: int = Query(1, ge=1),
    items_per_page: int = Query(10, ge=1),
):
    vote = await Vote.get_by_id(vote_id)
    if not vote:
        logger.warning(f"Vote with id {vote_id} not found.")
        raise HTTPException(status_code=404, detail=ERROR_CODES.NOT_FOUND)

    return await paginate(
        crud=bulletins_crud,
        page=page,
        per_page=items_per_page,
        sort_columns=["id"],
        sort_orders=["asc"],
        vote_id=vote_id,
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
    count, failures = await vote_utils.get_vote_count(vote_id)
    return VoteResultsModel(
        candidate_results=count,
        count_failures=failures,
        abstention_count=len(vote.attributed_users) - sum(count.values()),
        voter_count=len(vote.bulletins),
    )


@router.post(
    "/",
    operation_id="create_vote",
    response_model=FullVoteResponseModel,
    dependencies=[
        Depends(AUTH_MIDDLEWARE.RequireAuthenticated),
        Depends(ROUTES_GUARDS_MIDDLEWARE.AdminOnly),
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
