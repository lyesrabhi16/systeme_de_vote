from pydantic import BaseModel


class JWT_DATA(BaseModel):
    id: int
    exp: int | None = None


class TokenInput(BaseModel):
    token: str | None = None


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
