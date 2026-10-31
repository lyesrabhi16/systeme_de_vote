from enum import StrEnum


class Messages(StrEnum):
    LOGOUT_SUCCESS = "Logout successful"
    LOGIN_SUCCESS = "Login successful"
    OTP_RESENT_SUCCESS = "OTP resent successfully"
    PASSWORD_RESET_EMAIL_SENT = "Password reset email sent successfully"
    PASSWORD_RESET_SUCCESS = "Password has been reset successfully"
    VERIFICATION_EMAIL_SENT = "Verification email sent successfully"
    CANDIDATE_DELETED_SUCCESS = "Candidate deleted successfully"
