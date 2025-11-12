
import { Configuration, AuthApi } from '@api/sdk';
import type { ConfigurationParameters } from '@api/sdk';

const configParams: ConfigurationParameters = {
    basePath: 'http://localhost:8000',

};
const config = new Configuration(configParams);


export const apiClient = {
    auth: new AuthApi(config),
}


export default apiClient;