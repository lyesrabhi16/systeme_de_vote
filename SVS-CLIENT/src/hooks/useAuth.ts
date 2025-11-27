import type { OTPResendRequestModel, OTPVerificationModel, PasswordResetOTPModel, PasswordResetRequestModel, UserLoginModel } from "@/api/sdk";
import { logout, getToken, loadCurrentUser, login_password_step, login_otp_step, resendEmailOTP, PasswordEmailReset, ValidatePasswordEmailReset } from "@/services/auth";
import useGlobalStore from "@/services/store"

const useAuth = () => {
    const store = useGlobalStore();
    return {
        login_password_step: (data: UserLoginModel) => login_password_step(store, data),
        login_otp_step: (data: OTPVerificationModel) => login_otp_step(store, data),
        resend_otp_email: (data: OTPResendRequestModel) => resendEmailOTP(data),
        send_password_reset_email: (data: PasswordResetRequestModel) => PasswordEmailReset(data),
        validate_password_reset_email: (data: PasswordResetOTPModel) => ValidatePasswordEmailReset(data),
        logout: () => logout(store),
        load_current_user: () => loadCurrentUser(store),
        getToken: () => getToken(store),
        is_authenticated: () => store.user !== null,
        user: () => store.user,
    }
}

export default useAuth;