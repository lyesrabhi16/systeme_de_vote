import apiClient from "@/api/client";
import type { CurrentUserResponseModel, UserResponseModel } from "@/api/sdk";
import { toast } from "sonner";


export const getUserName = (user?: CurrentUserResponseModel | UserResponseModel | null) => {
    if (!user) return '';
    if (user.username) return user.username;
    if (user.first_name !== '' && user.last_name !== '') return `${user.first_name} ${user.last_name}`;
    return user.email;
};

export const getUserInitials = (user?: CurrentUserResponseModel | UserResponseModel | null) => {
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
        );
    } catch (error) {
        console.error(error);
        toast.error(
            `Échec de la ${!isActive ? "l'activation" : 'la désactivation'
            } de l'utilisateur ${user.email}`,
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