
import { Configuration, AuthApi, VoteApi, UsersApi, AdminApi, CandidatesApi, type ConfigurationParameters } from '@api/sdk';

export type PaginatedListResponse = {
    data: any[];
    total_count: number;
    has_more: boolean;
    page?: number | null | undefined;
    items_per_page?: number | null | undefined;
}

const getConfigParams: () => ConfigurationParameters = () => ({
    basePath: 'http://localhost:8000',
    //basePath: 'https://svs-server.localhost',
    accessToken: () => {
        return localStorage.getItem("token") || '';
    },
    baseOptions: {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem("token")}` : undefined,
        }
    }
});


export const apiClient = () => {
    //console.log("Creating API client with config:", getConfigParams());
    const config = new Configuration(getConfigParams());

    return {
        auth: new AuthApi(config),
        vote: new VoteApi(config),
        users: new UsersApi(config),
        admin: new AdminApi(config),
        candidates: new CandidatesApi(config),
    };
}


export default apiClient;