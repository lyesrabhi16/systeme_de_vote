
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
    VOTE_NOT_STARTED = "VOTE_NOT_STARTED",
    VOTE_NOT_FINISHED = "VOTE_NOT_FINISHED",
    NOT_ELIGIBLE = "NOT_ELIGIBLE",
    INVALID_BALLOT = "INVALID_BALLOT",
}


export type PaginatedListResponse = {
    data: unknown[];
    total_count: number;
    has_more: boolean;
    page?: number | null | undefined;
    items_per_page?: number | null | undefined;
}
// The session is the HttpOnly cookie the server sets at sign-in: this code never holds the token, so a script that runs in the page
// (an injected one included) cannot read it. The API is on the same origin as the page, under /api.
const AxiosInstance = axios.create({ withCredentials: true });
// For the requests whose failure is an answer, not an error to tell the user about ("am I signed in?")
const QuietAxiosInstance = axios.create({ withCredentials: true });

let AUTHENTICATION_REQUIRED_DETECTED = false;
AxiosInstance.interceptors.response.use(
    response => response,
    error => {
        // You can handle global errors here
        if (error.response) {
            // handle 403 Forbidden globally
            if (error.response.status === 403) {
                toast.error('Vous n\'avez pas la permission d\'effectuer cette action.', {
                    id: 'forbidden_error',
                });
            }
            // handle 401 Unauthorized globally
            console.log("API Error Response:", error.response);
            const login_required_codes = [
                ERROR_CODES.AUTHENTICATION_REQUIRED,
                ERROR_CODES.UNAUTHORIZED,
                ERROR_CODES.TOKEN_EXPIRED,
                ERROR_CODES.TOKEN_INVALID,
                ERROR_CODES.INVALID_CREDENTIALS,
            ]
            if (error.response.status === 401 && !String(error.config?.url ?? '').includes('/api/auth/') && login_required_codes.includes(error.response.data?.detail?.code) && !AUTHENTICATION_REQUIRED_DETECTED) {
                // Optionally, you can redirect to login or show a message
                AUTHENTICATION_REQUIRED_DETECTED = true;
                toast.getToasts().forEach(t => toast.dismiss(t.id));
                toast.error('Votre session a expiré. Veuillez vous reconnecter.', {
                    id: 'session_expired_error',
                });
                const onClose = () => {
                    AUTHENTICATION_REQUIRED_DETECTED = false;
                    if (!window.location.href.includes(routes.LOGIN)) {
                        window.location.href = window.location.origin + routes.LOGIN;
                    }
                };
                toast(
                    "Votre session a expiré. Vous allez être redirigé vers la page de connexion.",
                    {
                        id: 'session_expired_redirect',
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

// The paths of the SDK already start with /api: relative to the page.
const getConfigParams = (): ConfigurationParameters => ({
    basePath: '',
    baseOptions: {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
    },
});

export const apiClient = (options?: { quiet?: boolean }) => {
    const config = new Configuration(getConfigParams());
    const instance = options?.quiet ? QuietAxiosInstance : AxiosInstance;
    return {
        auth: new AuthApi(config, undefined, instance),
        vote: new VoteApi(config, undefined, instance),
        users: new UsersApi(config, undefined, instance),
        admin: new AdminApi(config, undefined, instance),
        candidates: new CandidatesApi(config, undefined, instance),
    };
}


export default apiClient;