import { api } from '../api/index.js';
import { createStore } from './createStore.js';

export const createSettingsStore = ({ settingsApi = api.settings } = {}) => {
  const store = createStore({ settings: {}, loading: false, saving: false, error: null });
  let inFlightLoad = null;
  let lastLoadAt = 0;
  let lastResult = null;
  return {
    ...store,
    async load({ force = false } = {}) {
      const now = Date.now();
      if (!force && lastResult && now - lastLoadAt < 1000) return lastResult;
      if (!force && inFlightLoad) return inFlightLoad;

      store.setState({ loading: true, error: null });
      inFlightLoad = (async () => {
        try {
          const result = await settingsApi.list();
          store.setState({ settings: result.data || {}, loading: false });
          lastLoadAt = Date.now();
          lastResult = result;
          return result;
        } catch (error) {
          store.setState({ loading: false, error });
          throw error;
        } finally {
          inFlightLoad = null;
        }
      })();
      return inFlightLoad;
    },
    async update(payload) {
      store.setState({ saving: true, error: null });
      try {
        const result = await settingsApi.update(payload);
        store.setState({ settings: result.data || {}, saving: false });
        return result;
      } catch (error) {
        store.setState({ saving: false, error });
        throw error;
      }
    }
  };
};

export const settingsStore = createSettingsStore();
