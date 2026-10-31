import { create } from "zustand";
import type { CurrentUserResponseModel } from "@api/sdk/api";

export interface GlobalStore {
    user: CurrentUserResponseModel | null;
    setUser: (user: CurrentUserResponseModel) => void;
    clearUser: () => void;

    temp_data?: { [key: string]: object | string | number | boolean };
    get_temp_data: (key: string) => object | string | number | boolean | null;
    set_temp_data: (key: string, value: object | boolean | string | number) => void;
}
const useGlobalStore = create<GlobalStore>((set, get) => ({
    user: null,
    setUser: (user: CurrentUserResponseModel) => set({ user }),
    clearUser: () => set({ user: null }),
    temp_data: {},
    get_temp_data: (key: string) => {
        // consume the temp data
        const temp_data = get().temp_data;
        if (temp_data && key in temp_data) {
            const value = temp_data[key];
            // delete the key
            //const { [key]: _, ...rest } = temp_data;
            //set({ temp_data: rest });
            return value;
        }
        return null;
    },
    set_temp_data: (key: string, value: object | string | number | boolean) => {
        set((state) => ({
            temp_data: {
                ...state.temp_data,
                [key]: value,
            },
        }));
    },
}));

export default useGlobalStore;