from fastapi import APIRouter
from app.models.user_login_model import UserLoginModel

router = APIRouter()


@router.post("/login")
async def login(data: UserLoginModel):
    return {"message": "Login successful", "credentials": data}

@router.post("/logout")
async def logout():
    return {"message": "Logout successful"}