from pydantic import BaseModel, Field


class JWT_DATA(BaseModel):
    id: int
    exp: int | None = None


class TokenInput(BaseModel):
    token: str | None = None


class RequiredTokenInput(BaseModel):
    token: str


class TokenResponse(BaseModel):
    token: str


class OTPVerificationModel(BaseModel):
    id: str
    otp: str
    remember_me: bool = False


class StoredOTPModel(BaseModel):
    otp_hash: str
    tries: int = 0
    max_tries: int = 3


class OTPResendRequestModel(BaseModel):
    id: str


class PasswordResetRequestModel(BaseModel):
    email: str


class PasswordResetOTPModel(BaseModel):
    id: str
    otp: str
    password: str = Field(min_length=8, max_length=128)
