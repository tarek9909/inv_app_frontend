import { api } from '../api/index.js';
import { tokenStorage } from '../api/tokenStorage.js';
import { createStore } from './createStore.js';

export const createAuthStore = ({ authApi = api.auth } = {}) => {
  const store = createStore({
    token: tokenStorage.get(),
    user: null,
    loading: false,
    error: null,
    initialized: false
  });

  const setSession = ({ token, user }) => {
    tokenStorage.set(token);
    store.setState({ token, user, error: null, initialized: true });
  };

  const clearSession = () => {
    tokenStorage.clear();
    store.setState({ token: null, user: null, initialized: true });
  };

  return {
    ...store,
    async login(credentials) {
      store.setState({ loading: true, error: null });
      try {
        const result = await authApi.login(credentials);
        setSession(result.data);
        store.setState({ loading: false });
        return result;
      } catch (error) {
        store.setState({ loading: false, error });
        throw error;
      }
    },
    async loadCurrentUser() {
      if (!tokenStorage.get()) {
        clearSession();
        return null;
      }
      store.setState({ loading: true, error: null });
      try {
        const result = await authApi.me();
        store.setState({ user: result.data?.user || null, loading: false, initialized: true });
        return result.data?.user || null;
      } catch (error) {
        clearSession();
        store.setState({ loading: false, error });
        throw error;
      }
    },
    async logout() {
      try {
        if (tokenStorage.get()) await authApi.logout();
      } finally {
        clearSession();
      }
    },
    async updateProfile(payload) {
      store.setState({ loading: true, error: null });
      try {
        const result = await authApi.updateProfile(payload);
        store.setState({ user: result.data?.user || store.getState().user, loading: false });
        return result;
      } catch (error) {
        store.setState({ loading: false, error });
        throw error;
      }
    },
    async changePassword(payload) {
      store.setState({ loading: true, error: null });
      try {
        const result = await authApi.changePassword(payload);
        const refreshed = await authApi.me().catch(() => null);
        store.setState({ user: refreshed?.data?.user || store.getState().user, loading: false });
        return result;
      } catch (error) {
        store.setState({ loading: false, error });
        throw error;
      }
    },
    hasRole(roleCode) {
      return store.getState().user?.role?.code === roleCode;
    },
    can(permission) {
      const user = store.getState().user;
      if (user?.role?.code === 'admin') return true;
      return (user?.permissions || []).includes(permission);
    }
  };
};

export const authStore = createAuthStore();
