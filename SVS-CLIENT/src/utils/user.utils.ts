import type { CurrentUserResponseModel } from "@/api/sdk";


export const getUserName = (user?: CurrentUserResponseModel | null) => {
    if (!user) return '';
    if (user.username) return user.username;
    if (user.first_name !== '' && user.last_name !== '') return `${user.first_name} ${user.last_name}`;
    return user.email;
};

export const getUserInitials = (user?: CurrentUserResponseModel | null) => {
    if (user && user.first_name !== '' && user.last_name !== '') return `${user.first_name.charAt(0).toUpperCase()}${user.last_name.charAt(0).toUpperCase()}`;
    return "U"; // Default initials if no name is available
};