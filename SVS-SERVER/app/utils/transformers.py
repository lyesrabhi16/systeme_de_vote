
from app.models.user import User, UserResponseModel


async def User_to_UserResponseModel(user_data: dict) -> UserResponseModel:
    return await UserResponseModel.from_user(User(**user_data))
