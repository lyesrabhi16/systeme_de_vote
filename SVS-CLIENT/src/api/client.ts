
import { routes } from '@/services/routing';
import { Configuration, AuthApi, VoteApi, UsersApi, AdminApi, CandidatesApi, type ConfigurationParameters } from '@api/sdk';
import axios from 'axios';
import { toast } from 'sonner';

export enum ERROR_CODES {
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
    USER_NOT_FOUND = "USER_NOT_FOUND",
    UNAUTHORIZED = "UNAUTHORIZED",
    FORBIDDEN = "FORBIDDEN",
    TOKEN_EXPIRED = "TOKEN_EXPIRED",
    TOKEN_INVALID = "TOKEN_INVALID",
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
    BAD_REQUEST = "BAD_REQUEST",
    AUTHENTICATION_REQUIRED = "AUTHENTICATION_REQUIRED",
    ALREADY_AUTHENTICATED = "ALREADY_AUTHENTICATED",
    INVALID_OTP = "INVALID_OTP",
    FAILED_OTP_VERIFICATION = "FAILED_OTP_VERIFICATION",
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
    NOT_FOUND = "NOT_FOUND",
    VOTE_FINISHED = "VOTE_FINISHED",
    ALREADY_VOTED = "ALREADY_VOTED",
    ADMIN_PRIVILEGES_REQUIRED = "ADMIN_PRIVILEGES_REQUIRED",
    EMAIL_ALREADY_EXISTS = "EMAIL_ALREADY_EXISTS",
    PHONE_NUMBER_ALREADY_EXISTS = "PHONE_NUMBER_ALREADY_EXISTS",
    USERNAME_ALREADY_EXISTS = "USERNAME_ALREADY_EXISTS",
}


export type PaginatedListResponse = {
    data: any[];
    total_count: number;
    has_more: boolean;
    page?: number | null | undefined;
    items_per_page?: number | null | undefined;
}
const AxiosInstance = axios.create({});

let AUTHENTICATION_REQUIRED_DETECTED = false;
AxiosInstance.interceptors.response.use(
    response => response,
    error => {
        // You can handle global errors here
        if (error.response) {
            // For example, handle 401 Unauthorized globally
            console.log("API Error Response:", error.response);
            const login_required_codes = [
                ERROR_CODES.AUTHENTICATION_REQUIRED,
                ERROR_CODES.UNAUTHORIZED,
                ERROR_CODES.TOKEN_EXPIRED,
                ERROR_CODES.TOKEN_INVALID,
            ]
            if (error.response.status === 401 && login_required_codes.includes(error.response.data?.detail?.code) && !AUTHENTICATION_REQUIRED_DETECTED) {
                // Optionally, you can redirect to login or show a message
                AUTHENTICATION_REQUIRED_DETECTED = true;
                toast.getToasts().forEach(t => toast.dismiss(t.id));
                toast.error('Votre session a expiré. Veuillez vous reconnecter.');
                const onClose = () => {
                    localStorage.removeItem("token");
                    AUTHENTICATION_REQUIRED_DETECTED = false;
                    if (!window.location.href.includes(routes.LOGIN)) {
                        window.location.href = routes.LOGIN;
                    }
                };
                toast(
                    "Votre session a expiré. Vous allez être redirigé vers la page de connexion.",
                    {
                        position: 'top-center',
                        dismissible: true,
                        duration: 5000,
                        cancel: true,
                        icon: '⚠️',
                        onAutoClose: onClose,
                        onDismiss: onClose,
                    }
                );
            }
        }
        return Promise.reject(error);
    }
)

const getConfigParams = (): ConfigurationParameters => {
    return {
        //basePath: 'http://localhost:8000',
        basePath: 'https://svs-server.localhost',
        baseOptions: {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem("token")}` : undefined,
            }
        }
    };
};

export const apiClient = () => {
    const config = new Configuration(getConfigParams());
    return {
        auth: new AuthApi(config, undefined, AxiosInstance),
        vote: new VoteApi(config, undefined, AxiosInstance),
        users: new UsersApi(config, undefined, AxiosInstance),
        admin: new AdminApi(config, undefined, AxiosInstance),
        candidates: new CandidatesApi(config, undefined, AxiosInstance),
    };
}


export default apiClient;