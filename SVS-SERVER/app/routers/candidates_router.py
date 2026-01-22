from fastapi import APIRouter, Request, Depends, HTTPException
from app.middlewares.auth_middleware import AUTH_MIDDLEWARE
from app.middlewares.routes_guards_middleware import ROUTES_GUARDS_MIDDLEWARE
from app.models.candidate import Candidate, CandidateUpdateModel, CandidateCreateModel
from app.models.response_models import MessageResponse
from app.models.messages import Messages

router = APIRouter()


@router.get(
    "/",
    operation_id="get_candidate_by_id",
    response_model=Candidate,
    dependencies=[Depends(AUTH_MIDDLEWARE.RequireAuthenticated)],
)
async def get_candidate_by_id(request: Request, id: int):
    candidate = await Candidate.get_by_id(id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return candidate


@router.post(
    "/",
    operation_id="create_candidate",
    response_model=Candidate,
    dependencies=[
        Depends(AUTH_MIDDLEWARE.RequireAuthenticated),
        Depends(ROUTES_GUARDS_MIDDLEWARE.AdminOnly),
    ],
)
async def create_candidate(request: Request, data: CandidateCreateModel):
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
    ],
)
async def update_candidate(request: Request, id: int, data: CandidateUpdateModel):
    candidate = await Candidate.get_by_id(id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

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
    ],
)
async def delete_candidate(request: Request, id: int):
    candidate = await Candidate.get_by_id(id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    # Implement deletion logic here
    await candidate.delete()
    return MessageResponse(message=Messages.CANDIDATE_DELETED_SUCCESS)
