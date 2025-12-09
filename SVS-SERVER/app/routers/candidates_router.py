from fastapi import APIRouter, Request, Depends, HTTPException
from app.middlewares.auth_middleware import AUTH_MIDDLEWARE
from app.models import Candidate

router = APIRouter()


@router.get(
    "/id",
    operation_id="get_candidate_by_id",
    response_model=Candidate,
    dependencies=[Depends(AUTH_MIDDLEWARE.RequireAuthenticated)],
)
async def get_candidate_by_id(request: Request, id: int):
    candidate = await Candidate.get_by_id(id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return candidate
