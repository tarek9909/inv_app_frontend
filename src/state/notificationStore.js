import { api } from '../api/index.js';
import { createStore } from './createStore.js';

export const createNotificationStore = ({ notificationApi = api.notifications } = {}) => {
  const store = createStore({ rows: [], meta: {}, loading: false, error: null });
  return {
    ...store,
    async load(params = {}) {
      store.setState({ loading: true, error: null });
      try {
        const result = await notificationApi.list(params);
        store.setState({ rows: result.data || [], meta: result.meta || {}, loading: false });
        return result;
      } catch (error) {
        store.setState({ error, loading: false });
        throw error;
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
