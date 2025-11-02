from typing import Optional
from pydantic import BaseModel


class UserLoginModel(BaseModel):
    username: str
    password: str
    remember_me: Optional[bool] = False
