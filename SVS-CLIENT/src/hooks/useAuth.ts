import type { UserLoginModel } from "@/api/sdk";
import { logout, getToken, loadCurrentUser, login } from "@/services/auth";
import useGlobalStore from "@/services/store"

const useAuth = () => {
    const store = useGlobalStore();
    return {
        login: (data: UserLoginModel) => login(store, data),
        logout: () => logout(store),
        loadCurrentUser: () => loadCurrentUser(store),
        getToken: () => getToken(store),
        is_authenticated: () => store.user !== null,
        user: () => store.user,
    }
}

export default useAuth;