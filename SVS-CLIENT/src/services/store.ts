import { create } from "zustand";
import type { CurrentUserResponseModel } from "@api/sdk/api";

export interface GlobalStore {
    user: CurrentUserResponseModel | null;
    token: string | null;
    setUser: (user: CurrentUserResponseModel) => void;
    clearUser: () => void;
    setToken: (token: string | null) => void;
}
const useGlobalStore = create<GlobalStore>((set) => ({
    user: null,
    token: null,
    setUser: (user: CurrentUserResponseModel) => set({ user }),
    setToken: (token: string | null) => set({ token }),
    clearUser: () => set({ user: null, token: null }),
}));

export default useGlobalStore;