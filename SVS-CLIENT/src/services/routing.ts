export const routes = Object.freeze({
    HOME: '/',
    LOGIN: '/login',
    NOT_FOUND: '*',
    OTP_VERIFICATION: '/login/verify-otp',
    RESET_PASSWORD: '/reset-password',
    VOTE: '/vote/:voteId',
});

const getVoteRoute = (voteId: string | number) => {
    return `/vote/${voteId}`;
};

export const routesBuilders = {
    getVoteRoute,
}