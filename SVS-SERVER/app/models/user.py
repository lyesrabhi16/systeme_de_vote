from sqlmodel import SQLModel, Field


class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    first_name: str = Field(..., title="First Name", max_length=100)
    last_name: str = Field(..., title="Last Name", max_length=100)
    email: str = Field(..., title="Email", max_length=256)
    verified_email: bool = Field(..., title="Verified Email")
    username: str = Field(..., title="Username", max_length=100)
    password: str = Field(..., title="Password")
    ssn: str = Field(..., title="SSN", max_length=100)
    phone_number: str = Field(..., title="Phone Number", max_length=100)
    verified_phone_number: bool = Field(..., title="Verified Phone Number")
    is_active: bool = Field(..., title="Is Active")
    is_admin: bool = Field(..., title="Is Admin")
