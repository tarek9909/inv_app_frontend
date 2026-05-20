import { api } from '../api/index.js';
import { createStore } from './createStore.js';

export const createDriverStore = ({ driverApi = api.driver } = {}) => {
  const store = createStore({ driver: null, rows: [], current: null, loading: false, error: null });
  return {
    ...store,
    async loadMe() {
      store.setState({ loading: true, error: null });
      try {
        const result = await driverApi.me();
        store.setState({ driver: result.data?.driver || null, loading: false });
        return result;
      } catch (error) {
        store.setState({ loading: false, error });
        throw error;
      }
    },
    async loadRequests() {
      store.setState({ loading: true, error: null });
      try {
        const result = await driverApi.stockRequests.list();
        store.setState({ rows: Array.isArray(result.data) ? result.data : [], loading: false });
        return result;
      } catch (error) {
        store.setState({ loading: false, error });
        throw error;
      }
    },
    async loadRequest(id) {
      const result = await driverApi.stockRequests.get(id);
      store.setState({ current: result.data || null });
      return result;
    },
    async markInvoiceViewed(id) {
      const result = await driverApi.stockRequests.markInvoiceViewed(id);
      store.setState({ current: result.data || null });
      return result;
    },
    async submitReceipt(id, payload) {
      const result = await driverApi.stockRequests.submitReceipt(id, payload);
      store.setState({ current: result.data || null });
      return result;
    }
  };
};

export const driverStore = createDriverStore();
