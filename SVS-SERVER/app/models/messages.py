from enum import Enum


class Messages(str, Enum):
    LOGOUT_SUCCESS = "Logout successful"
    LOGIN_SUCCESS = "Login successful"
    OTP_RESENT_SUCCESS = "OTP resent successfully"
