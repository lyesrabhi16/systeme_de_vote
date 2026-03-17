import { IdentifierType, type OTPResendRequestModel, type OTPVerificationModel, type PasswordResetOTPModel } from "@/api/sdk";
import useAuth from "@/hooks/useAuth";
import type { EmailSchemaType, LoginFormSchemaType } from "@/schemas/auth.schemas";
import { routes } from "@/services/routing";
import useGlobalStore from "@/services/store";
import type { AxiosError } from "axios";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";



export const useAuthActions = (init_data?: {
    loading?: {
        loginButton: boolean;
        resetPasswordRequestButton: boolean;
        passwordResetButton: boolean;
    },
    resendButtonState?: {
        disabled: boolean;
        text: string;
        timer: number;
    },
}) => {
    const navigate = useNavigate();
    const auth = useAuth();
    const store = useGlobalStore();

    const [loading, setLoading] = useState(init_data?.loading || {
        loginButton: false,
        resetPasswordRequestButton: false,
        passwordResetButton: false,
    });
    const [resendButtonState, setResendButtonState] = useState(init_data?.resendButtonState || {
        disabled: false,
        text: 'Renvoyez le code',
        timer: 0,
    });

    const getMaskedEmail: () => string = () => {
        const login_data = store.get_temp_data('login_data');
        //console.log('login_data: ', login_data);
        //console.log('store temp data: ', store.temp_data);
        if (
            typeof login_data === 'object' &&
            login_data &&
            'masked_email' in login_data
        ) {
            return login_data['masked_email'] as string;
        }
        return '';
    };
    const handleSubmitOtpVerificationForm = async (e: React.FormEvent<HTMLFormElement>, data: OTPVerificationModel) => {
        e.preventDefault();
        auth
            .login_otp_step({ otp: data.otp, id: data.id, remember_me: store.get_temp_data('remember_me') as boolean || false })
            .then(() => {
                //console.log('Login OTP verification step successful');
                const first_login = store.get_temp_data('first_login') as boolean || false;
                if (first_login) {
                    navigate(routes.RESET_PASSWORD);
                    toast.success(
                        'Authentification réussie, veuillez changer votre mot de passe', {
                        id: 'first_login_success',
                    }
                    );
                    return;
                }
                navigate(routes.HOME);
                toast.success(
                    'Authentification réussie, vous êtes maintenant connecté', {
                    id: 'login_success',
                }
                );
            })
            .catch((_err) => {
                //console.log('Login OTP verification step failed:', err);
                toast.error("Echec de l'authentification : code OTP invalide", {
                    id: 'otp_verification_failed',
                });
            });
    };
    const handleResendCode = async (data: OTPResendRequestModel) => {
        auth
            .resend_otp_email({
                id: data.id,
            })
            .then((_res) => {
                //console.log('otp email resent: ', res);
                toast.success('Code OTP renvoyé avec succès par e-mail', {
                    id: 'otp_resent_success',
                });
                setResendButtonState({
                    disabled: true,
                    text: 'Renvoyez le code',
                    timer: 60,
                });
            })
            .catch((err) => {
                console.log('err in resend email: ', err);
                toast.error("Échec de l'envoi du code OTP par e-mail", {
                    id: 'otp_resent_failed',
                });
            });
    };

    const getTransformedData = (data: LoginFormSchemaType) => {
        let type: IdentifierType = IdentifierType.Email;

        // Simple check to see if the input is a phone number
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        if (phoneRegex.test(data.email)) {
            type = IdentifierType.PhoneNumber;
        }

        return {
            identifier: data.email,
            IdentifierType: type,
            password: data.password,
        };
    };

    const handleSubmitLoginForm = (data: LoginFormSchemaType) => {
        setLoading({ ...loading, loginButton: true });
        const _data = getTransformedData(data);
        // Handle form submission logic here
        auth
            .login_password_step({
                identifier: _data.identifier,
                password: _data.password,
                identifier_type: _data.IdentifierType,
            })
            .then((d) => {
                if (d.id === null) {
                    console.error('Login failed: No id returned');
                    toast.error('Échec de la connexion : identifiants invalides', {
                        id: 'invalid_credentials',
                    });
                    return;
                }
                navigate(`${routes.OTP_VERIFICATION}/${d.id}`);
                store.set_temp_data('login_data', d);
                store.set_temp_data('remember_me', data.remember_me || false);
                store.set_temp_data('first_login', d.first_login || false);
                //console.log('Login password step successful:', d.id);
                toast.success('Connexion réussie, veuillez vérifier votre OTP', {
                    id: 'login_password_step_success',
                });
            })
            .catch((error: AxiosError) => {
                console.error('Login failed:', error);
                if (error.response?.data) {
                    const { detail } =
                        (error.response.data as {
                            detail: {
                                code: string;
                            };
                        }) || undefined;
                    if (detail?.code === 'INVALID_CREDENTIALS') {
                        toast.error('Échec de la connexion : identifiants invalides', {
                            id: 'invalid_credentials',
                        });
                        return;
                    }
                }
                toast.error('Échec de la connexion : une erreur est survenue', {
                    id: 'login_failed',
                });
            })
            .finally(() => {
                setLoading({ ...loading, loginButton: false });
            });
    };

    const handleSubmitPasswordResetRequestForm = (data: EmailSchemaType) => {
        setLoading({ ...loading, resetPasswordRequestButton: true });
        auth
            .send_password_reset_email({ email: data.email })
            .then(() => {
                toast.success(
                    'E-mail de réinitialisation du mot de passe envoyé avec succès', {
                    id: 'password_reset_email_sent',
                }
                );
            })
            .catch((error: AxiosError) => {
                console.error('Password reset request failed:', error);
                toast.error(
                    "Échec de l'envoi de l'e-mail de réinitialisation du mot de passe", {
                    id: 'password_reset_email_failed',
                }
                );
            })
            .finally(() => {
                setLoading({ ...loading, resetPasswordRequestButton: false });
            });
    };

    const handleSubmitPasswordResetForm = (data: PasswordResetOTPModel) => {
        setLoading({ ...loading, passwordResetButton: true });
        auth.validate_password_reset_email(data).then(
            () => {
                toast.success("Mot de passe réinitialiser avec success", {
                    id: 'password_reset_success',
                });
                navigate(routes.LOGIN);
            }
        ).catch(
            () => {
                toast.error('Erreur de réinitialiser du mot de passe', {
                    id: 'password_reset_failed',
                });
            }
        ).finally(() => setLoading({ ...loading, passwordResetButton: false }))
    }
    return {
        handleSubmitOtpVerificationForm,
        handleResendCode,
        getTransformedData,
        handleSubmitLoginForm,
        loading,
        setLoading,
        resendButtonState,
        setResendButtonState,
        getMaskedEmail,
        handleSubmitPasswordResetRequestForm,
        handleSubmitPasswordResetForm,
    };

};
export default useAuthActions;