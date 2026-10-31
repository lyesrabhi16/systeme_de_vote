import type { GlobalStore } from "@/services/store";
import { apiClient } from "@/api/client";
import type { UserLoginModel, OTPVerificationModel, OTPResendRequestModel, PasswordResetRequestModel, PasswordResetOTPModel } from "@/api/sdk";


export const login_password_step = async (data: UserLoginModel) => {
    const api_response = await apiClient().auth.login(data);
    return api_response.data;
};

export const login_otp_step = async (store: GlobalStore, data: OTPVerificationModel) => {
    // The server answers with the session as a cookie (HttpOnly: not readable from here). The token in the body is for other
    // kinds of clients; it is not kept.
    await apiClient().auth.verifyOTP(data);
    return loadCurrentUser(store);
}

/** Who is signed in: asked to the server, which knows from the cookie. null when nobody is. */
export const loadCurrentUser = async (store: GlobalStore) => {
    if (store.user) {
        return store.user;
    }
    try {
        const api_response = await apiClient({ quiet: true }).auth.getCurrentUser();
        store.setUser(api_response.data);
        return api_response.data;
    } catch (e) {
        const status = (e as { response?: { status?: number } }).response?.status;
        if (status === 401 || status === 403) {
            return null;
        }
        throw e;
    }
};

export const logout = async (store: GlobalStore) => {
    store.clearUser();
    await apiClient().auth.logout();
};

export const resendEmailOTP = async (data: OTPResendRequestModel) => {
    await apiClient().auth.resendOtp(data);
};

export const PasswordEmailReset = async (data: PasswordResetRequestModel) => {
    await apiClient().auth.passwordResetRequest(data);
}

export const ValidatePasswordEmailReset = async (data: PasswordResetOTPModel) => {
    await apiClient().auth.validatePasswordReset(data);
}
