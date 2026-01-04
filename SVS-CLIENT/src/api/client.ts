
import { Configuration, AuthApi, VoteApi, type ConfigurationParameters } from '@api/sdk';


const getConfigParams: () => ConfigurationParameters = () => ({
    //basePath: 'http://localhost:8000',
    basePath: 'https://svs-server.localhost',
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
    };
}


export default apiClient;