from sqlmodel import SQLModel, Field
from pydantic import BaseModel

class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    first_name: str = Field(..., title="First Name", max_length=100)
    last_name: str = Field(..., title="Last Name", max_length=100)
    email: str = Field(..., title="Email", max_length=256, unique=True)
    verified_email: bool = Field(..., title="Verified Email")
    username: str = Field(..., title="Username", max_length=100, unique=True)
    password: str = Field(..., title="Password")
    ssn: str = Field(..., title="SSN", max_length=100, unique=True)
    phone_number: str = Field(..., title="Phone Number", max_length=100, unique=True)
    verified_phone_number: bool = Field(..., title="Verified Phone Number")
    is_active: bool = Field(..., title="Is Active")
    is_admin: bool = Field(..., title="Is Admin")

class CurrentUserResponseModel(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    verified_email: bool
    username: str
    phone_number: str
    verified_phone_number: bool
    is_active: bool
    is_admin: bool