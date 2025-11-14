import type { GlobalStore } from "@/services/store";
import { apiClient } from "@/api/client";
import type { UserLoginModel } from "@/api/sdk";


export const login = async (store: GlobalStore, data: UserLoginModel) => {
    const api_response = await apiClient.auth.login(data);
    // Save token to local storage
    const token = api_response.data.token;
    localStorage.setItem("token", token);
    store.setToken(token);
    await loadCurrentUser(store);
    return store.user;
}

export const loadCurrentUser = async (store: GlobalStore) => {
    if (store.user) {
        return store.user;
    }
    const api_response = await apiClient.auth.getCurrentUser(
        {
            token: getToken(store),
        }
    );
    const user = api_response.data;
    store.setUser(user);
    return user;
};

export const logout = (store: GlobalStore) => {
    store.clearUser();
    localStorage.removeItem("token");
};

export const getToken = (store: GlobalStore): string | null => {
    if (store.token) {
        return store.token;
    }
    // check local storage
    const token = localStorage.getItem("token");
    if (token) {
        store.setToken(token);
        return token;
    }
    return null;

};
