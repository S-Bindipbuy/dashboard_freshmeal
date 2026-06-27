import { writable, derived } from 'svelte/store';
import {
  apiLogin,
  apiGetProfile,
  clearAuth,
  getToken,
  getUserId,
  getUserName,
  type LoginResponse,
  type ProfileResponse,
} from '$lib/api';

function createAuthStore() {
  const { subscribe, set, update } = writable<{
    token: string | null;
    userId: number | null;
    userName: string | null;
    profile: ProfileResponse | null;
    loading: boolean;
    error: string | null;
  }>({
    token: getToken(),
    userId: getUserId(),
    userName: getUserName(),
    profile: null,
    loading: false,
    error: null,
  });

  return {
    subscribe,

    async login(email: string, password: string) {
      update(s => ({ ...s, loading: true, error: null }));
      try {
        const data: LoginResponse = await apiLogin(email, password);
        update(s => ({ ...s, token: data.token, userId: data.id, userName: data.name, loading: false }));
        try {
          const profile = await apiGetProfile();
          update(s => ({ ...s, profile }));
        } catch { /* profile fetch is best-effort */ }
        return data;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        update(s => ({ ...s, loading: false, error: msg }));
        throw e;
      }
    },

    logout() {
      clearAuth();
      set({ token: null, userId: null, userName: null, profile: null, loading: false, error: null });
    },

    clearError() {
      update(s => ({ ...s, error: null }));
    },

    _setProfile(profile: ProfileResponse) {
      update(s => ({ ...s, profile }));
    },

    async _setProfileFromApi() {
      try {
        const profile = await apiGetProfile();
        update(s => ({ ...s, profile }));
      } catch { /* best-effort */ }
    },
  };
}

export const authStore = createAuthStore();

if (getToken()) {
  authStore._setProfileFromApi();
}

export const isLoggedIn = derived(authStore, $a => !!$a.token);
export const isAdmin = derived(authStore, $a => $a.profile?.role === 'admin');
export const currentUser = derived(authStore, $a => $a.profile);
