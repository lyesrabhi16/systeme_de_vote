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
    VOTES_ADMINISTRATION: '/admin/votes',
    VOTE_ADMINISTRATION: '/admin/vote/:voteId?/:type?',
});

const getVoteRoute = (voteId: string | number) => {
    return `/vote/${voteId}`;
};
const build = (data: Record<string, string | number | undefined>, routeTemplate: string) => {
    let route = routeTemplate;
    for (const [key, value] of Object.entries(data)) {
        if (value === undefined) {
            continue;
        }
        route = route.replace(`:${key}`, encodeURIComponent(String(value)));
    }
    // remove all optional params that were not provided
    route = route.replace(/\/:([a-zA-Z0-9_]+)\?/g, '');
    return route;
};

export const routesBuilders = {
    getVoteRoute,
    build,
}