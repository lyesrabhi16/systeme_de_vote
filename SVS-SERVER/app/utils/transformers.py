from typing import Dict
from app.models.user import UserResponseModel, User


async def User_to_UserResponseModel(user_data: Dict) -> UserResponseModel:
    return await UserResponseModel.from_user(User(**user_data))
