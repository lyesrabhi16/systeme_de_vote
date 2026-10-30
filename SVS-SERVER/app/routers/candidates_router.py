from fastapi import APIRouter, Depends, HTTPException, Request

from app.middlewares.auth_middleware import AUTH_MIDDLEWARE
from app.middlewares.routes_guards_middleware import ROUTES_GUARDS_MIDDLEWARE
from app.models.candidate import Candidate, CandidateCreateModel, CandidateUpdateModel
from app.models.error_codes import ERROR_CODES
from app.models.messages import Messages
from app.models.response_models import MessageResponse
from app.models.vote import Vote

router = APIRouter()


async def editable_vote(vote_id: int | None) -> Vote:
    """
    The candidates of an election are fixed when it opens: a ballot has one entry for each of them, so removing or adding one
    afterwards would make every ballot already cast invalid.
    """
    vote = await Vote.get_by_id(vote_id) if vote_id is not None else None
    if vote is None:
        raise HTTPException(status_code=404, detail=ERROR_CODES.NOT_FOUND)
    if vote.has_started():
        raise HTTPException(status_code=400, detail=ERROR_CODES.VOTE_STARTED_CANNOT_UPDATE)
    return vote


@router.get(
    "/",
    operation_id="get_candidate_by_id",
    response_model=Candidate,
    dependencies=[Depends(AUTH_MIDDLEWARE.RequireAuthenticated)],
)
async def get_candidate_by_id(request: Request, id: int):
    candidate = await Candidate.get_by_id(id)
    vote = await Vote.get_by_id(candidate.vote_id) if candidate else None
    if not candidate or not vote or not vote.is_visible_to(request.state.user):
        raise HTTPException(status_code=404, detail=ERROR_CODES.NOT_FOUND)  # the same answer: it is not said which exist
    return candidate


@router.post(
    "/",
    operation_id="create_candidate",
    response_model=Candidate,
    dependencies=[
        Depends(AUTH_MIDDLEWARE.RequireAuthenticated),
        Depends(ROUTES_GUARDS_MIDDLEWARE.AdminOnly),
        Depends(ROUTES_GUARDS_MIDDLEWARE.VoteAuthorityOnly),
    ],
)
async def create_candidate(request: Request, data: CandidateCreateModel):
    await editable_vote(data.vote_id)
    candidate = Candidate(
        first_name=data.first_name,
        last_name=data.last_name,
        photo_url=data.photo_url,
        vote_id=data.vote_id,
    )
    await candidate.save()
    return candidate


@router.put(
    "/",
    operation_id="update_candidate",
    response_model=Candidate,
    dependencies=[
        Depends(AUTH_MIDDLEWARE.RequireAuthenticated),
        Depends(ROUTES_GUARDS_MIDDLEWARE.AdminOnly),
        Depends(ROUTES_GUARDS_MIDDLEWARE.VoteAuthorityOnly),
    ],
)
async def update_candidate(request: Request, id: int, data: CandidateUpdateModel):
    candidate = await Candidate.get_by_id(id)
    if not candidate:
        raise HTTPException(status_code=404, detail=ERROR_CODES.NOT_FOUND)
    await editable_vote(candidate.vote_id)

    if data.first_name is not None:
        candidate.first_name = data.first_name
    if data.last_name is not None:
        candidate.last_name = data.last_name
    if data.photo_url is not None:
        candidate.photo_url = data.photo_url

    await candidate.save()
    return candidate


@router.delete(
    "/",
    operation_id="delete_candidate",
    dependencies=[
        Depends(AUTH_MIDDLEWARE.RequireAuthenticated),
        Depends(ROUTES_GUARDS_MIDDLEWARE.AdminOnly),
        Depends(ROUTES_GUARDS_MIDDLEWARE.VoteAuthorityOnly),
    ],
)
async def delete_candidate(request: Request, id: int):
    candidate = await Candidate.get_by_id(id)
    if not candidate:
        raise HTTPException(status_code=404, detail=ERROR_CODES.NOT_FOUND)
    await editable_vote(candidate.vote_id)
    await candidate.delete()
    return MessageResponse(message=Messages.CANDIDATE_DELETED_SUCCESS)
