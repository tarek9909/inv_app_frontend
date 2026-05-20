import { api } from '../api/index.js';
import { createStore } from './createStore.js';

export const createNotificationStore = ({ notificationApi = api.notifications } = {}) => {
  const store = createStore({ rows: [], meta: {}, loading: false, error: null });
  const inFlightLoads = new Map();
  return {
    ...store,
    async load(params = {}) {
      const key = JSON.stringify(Object.keys(params).sort().reduce((acc, itemKey) => {
        const value = params[itemKey];
        if (value !== undefined && value !== null && value !== '') acc[itemKey] = value;
        return acc;
      }, {}));
      if (inFlightLoads.has(key)) return inFlightLoads.get(key);

      store.setState({ loading: true, error: null });
      const promise = (async () => {
        const result = await notificationApi.list(params);
        store.setState({ rows: result.data || [], meta: result.meta || {}, loading: false });
        return result;
      })();
      inFlightLoads.set(key, promise);

      try {
        return await promise;
      } catch (error) {
        store.setState({ error, loading: false });
        throw error;
      } finally {
        inFlightLoads.delete(key);
      }
    },
    async markRead(id) {
      await notificationApi.markRead(id);
      return this.load();
    },
    async markAllRead() {
      await notificationApi.markAllRead();
      return this.load();
    }
  };
};

export const notificationStore = createNotificationStore();
