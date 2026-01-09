export const routes = Object.freeze({
    HOME: '/',
    LOGIN: '/login',
    ABOUT: '/about',
    CONTACT: '/contact',
    NOT_ALLOWED: '/forbidden',
    NOT_FOUND: '*',
    OTP_VERIFICATION: '/login/verify-otp',
    RESET_PASSWORD: '/reset-password',
    VOTE: '/vote/:voteId',
    ADMIN: '/admin',
    PICK_USERS_ADMINISTRATION: '/admin/users-administration',
    USERS_ADMINISTRATION: '/admin/users',
    ADMIN_ADMINISTRATION: '/admin/administrators',
});

const getVoteRoute = (voteId: string | number) => {
    return `/vote/${voteId}`;
};

export const routesBuilders = {
    getVoteRoute,
}