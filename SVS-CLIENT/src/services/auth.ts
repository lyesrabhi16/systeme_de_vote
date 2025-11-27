import type { GlobalStore } from "@/services/store";
import { apiClient } from "@/api/client";
import type { UserLoginModel, OTPVerificationModel, OTPResendRequestModel, PasswordResetRequestModel, PasswordResetOTPModel } from "@/api/sdk";


export const login_password_step = async (store: GlobalStore, data: UserLoginModel) => {
    const api_response = await apiClient.auth.login(data);
    return api_response.data;
};
export const login_otp_step = async (store: GlobalStore, data: OTPVerificationModel) => {
    const api_response = await apiClient.auth.verifyOTP(data);
    const token = api_response.data.token;
    await saveToken(store, token);
    return store.user;
}

const saveToken = async (store: GlobalStore, token: string) => {
    localStorage.setItem("token", token);
    store.setToken(token);
    await loadCurrentUser(store);
};
export const loadCurrentUser = async (store: GlobalStore) => {
    if (store.user) {
        return store.user;
    }
    const api_response = await apiClient.auth.getCurrentUser(
        {
            token: getToken(store),
        }
    );
    const user = api_response.data;
    store.setUser(user);
    return user;
};

export const logout = (store: GlobalStore) => {
    store.clearUser();
    localStorage.removeItem("token");
};

export const getToken = (store: GlobalStore): string | null => {
    if (store.token) {
        return store.token;
    }
    // check local storage
    const token = localStorage.getItem("token");
    if (token) {
        store.setToken(token);
        return token;
    }
    return null;

};

export const resendEmailOTP = async (data: OTPResendRequestModel) => {
    await apiClient.auth.resendOtp(data);
};

export const PasswordEmailReset = async (data: PasswordResetRequestModel) => {
    await apiClient.auth.passwordResetRequest(data);
}

export const ValidatePasswordEmailReset = async (data: PasswordResetOTPModel) => {
    await apiClient.auth.validatePasswordReset(data);
}