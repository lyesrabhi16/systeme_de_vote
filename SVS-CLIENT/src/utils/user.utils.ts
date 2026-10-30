import apiClient from "@/api/client";
import { CurrentUserResponseModelAuthorityEnum, type UserResponseModel } from "@/api/sdk";
import { toast } from "sonner";


/** What is needed to name somebody: an account, or the creator of an election (who is shown by name only, never by email address). */
export type NamedUser = { username?: string; first_name: string; last_name: string; email?: string };

export const getUserName = (user?: NamedUser | null) => {
    if (!user) return '';
    if (user.username) return user.username;
    if (user.first_name !== '' && user.last_name !== '') return `${user.first_name} ${user.last_name}`;
    return user.email ?? '';
};

export const getUserInitials = (user?: NamedUser | null) => {
    if (user === undefined || user?.first_name === undefined || user?.last_name === undefined) {
        return "U"; // Default initials if no name is available
    }
    let result = "";
    if (user?.first_name !== '') {
        result += user.first_name.charAt(0).toUpperCase();
    }
    if (user?.first_name !== '') {
        result += user.last_name.charAt(0).toUpperCase();
    }
    if (result === "") {
        return "U";
    }
    return result;
};

export const SwitchUserActivationState = async (
    user: UserResponseModel,
    setLoading: (loading: boolean) => void,
) => {
    setLoading(true);
    const userId = user.id;
    const isActive = user.is_active;
    try {
        await apiClient().users.adminUpdateUser(userId, {
            is_active: !isActive,
        });
        toast.success(
            `Utilisateur ${user.email} ${!isActive ? 'activé' : 'désactivé'
            } avec succès`,
            {
                id: `user_${userId}_activation_${!isActive ? 'activated' : 'deactivated'}_success`,
            }
        );
    } catch (error) {
        console.error(error);
        toast.error(
            `Échec de la ${!isActive ? "l'activation" : 'la désactivation'
            } de l'utilisateur ${user.email}`,
            {
                id: `user_${userId}_activation_${!isActive ? 'activated' : 'deactivated'}_error`,
            }
        );
    } finally {
        setLoading(false);
    }
};

export const SwitchUserAuthority = async (
    user: UserResponseModel,
    setLoading: (loading: boolean) => void,
) => {
    setLoading(true);
    const userId = user.id;
    const to_authority = user.authority === CurrentUserResponseModelAuthorityEnum.Inscription ? CurrentUserResponseModelAuthorityEnum.Vote : CurrentUserResponseModelAuthorityEnum.Inscription;
    try {
        await apiClient().users.adminUpdateUser(userId, {
            authority: to_authority,
        });
        toast.success(
            `Autorité de l'utilisateur ${user.email} mise à jour vers ${to_authority} avec succès`,
            {
                id: `user_${userId}_authority_updated_success`,
            }
        );
    } catch (error) {
        console.error(error);
        toast.error(
            `Échec de la mise à jour de l'autorité de l'utilisateur ${user.email}`,
            {
                id: `user_${userId}_authority_updated_error`,
            }
        );
    } finally {
        setLoading(false);
    }
};


export const UserFormModalTypes = {
    readonly: {
        title: 'View User',
        description: 'This is a read-only view of the user details.',
    },
    default: {
        title: 'Edit User',
        description: 'Modify the user details below.',
    },
    add: {
        title: 'Add User',
        description: 'Fill in the details to add a new user.',
    },
};