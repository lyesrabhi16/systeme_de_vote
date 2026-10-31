import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
    verifyOTP: vi.fn(),
    getCurrentUser: vi.fn(),
    logout: vi.fn(),
    calls: [] as { quiet?: boolean }[],
}));

vi.mock("@/api/client", () => ({
    apiClient: (options?: { quiet?: boolean }) => {
        api.calls.push(options ?? {});
        return { auth: { verifyOTP: api.verifyOTP, getCurrentUser: api.getCurrentUser, logout: api.logout } };
    },
}));

import { loadCurrentUser, login_otp_step, logout } from "./auth";
import type { GlobalStore } from "./store";

const ada = { id: 1, username: "ada" };

const storeWith = (user: unknown = null) => {
    const store = {
        user,
        setUser: vi.fn((u: unknown) => {
            store.user = u;
        }),
        clearUser: vi.fn(() => {
            store.user = null;
        }),
    };
    return store as unknown as GlobalStore & typeof store;
};

const rejection = (status: number) => Object.assign(new Error(`HTTP ${status}`), { response: { status } });

beforeEach(() => {
    vi.clearAllMocks();
    api.calls.length = 0;
});

describe("the session", () => {
    it("is the cookie: signing in keeps no token anywhere in the page", async () => {
        const storage = { setItem: vi.fn(), getItem: vi.fn(() => null), removeItem: vi.fn() };
        vi.stubGlobal("localStorage", storage);
        api.verifyOTP.mockResolvedValue({ data: { token: "a.jwt.token" } });
        api.getCurrentUser.mockResolvedValue({ data: ada });
        const store = storeWith();

        const user = await login_otp_step(store, { id: "x", otp: "ABC123", remember_me: false });

        expect(user).toEqual(ada);
        expect(store.user).toEqual(ada);
        expect(storage.setItem).not.toHaveBeenCalled();
        expect(JSON.stringify(store)).not.toContain("a.jwt.token");
        // who is signed in is asked with no token at all: the cookie is what identifies the request
        expect(api.getCurrentUser).toHaveBeenCalledWith();
        vi.unstubAllGlobals();
    });

    it("is asked to the server, quietly: 'nobody' is an answer, not a session that expired", async () => {
        api.getCurrentUser.mockRejectedValue(rejection(401));
        const store = storeWith();
        expect(await loadCurrentUser(store)).toBeNull();
        expect(store.setUser).not.toHaveBeenCalled();
        expect(api.calls).toEqual([{ quiet: true }]);
    });

    it("is not asked again when the user is known", async () => {
        const store = storeWith(ada);
        expect(await loadCurrentUser(store)).toEqual(ada);
        expect(api.getCurrentUser).not.toHaveBeenCalled();
    });

    it("lets a server error through: it is not the same as nobody being signed in", async () => {
        api.getCurrentUser.mockRejectedValue(rejection(500));
        await expect(loadCurrentUser(storeWith())).rejects.toThrow("HTTP 500");
    });

    it("ends with the server removing the cookie, and the user forgotten here", async () => {
        api.logout.mockResolvedValue({});
        const store = storeWith(ada);
        await logout(store);
        expect(store.user).toBeNull();
        expect(api.logout).toHaveBeenCalledOnce();
    });
});
