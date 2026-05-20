import { createStore } from './createStore.js';

export const createResourceStore = ({ api, initialFilters = { page: 1, limit: 20, search: '' } }) => {
  const inFlightLoads = new Map();
  let lastLoad = { key: '', at: 0, result: null };
  const repeatLoadCacheMs = 1000;
  const store = createStore({
    rows: [],
    current: null,
    meta: {},
    filters: initialFilters,
    loading: false,
    saving: false,
    error: null,
    lastMessage: ''
  });

  const invalidateLoadCache = () => {
    lastLoad = { key: '', at: 0, result: null };
  };

  const run = async (flag, action) => {
    store.setState({ [flag]: true, error: null, lastMessage: '' });
    try {
      const result = await action();
      store.setState({ [flag]: false, lastMessage: result.message || '' });
      return result;
    } catch (error) {
      store.setState({ [flag]: false, error });
      throw error;
    }
  };

  const load = async (filters = {}) => {
    const { force, ...requestedFilters } = filters;
    const nextFilters = { ...store.getState().filters, ...requestedFilters };
    const key = JSON.stringify(Object.keys(nextFilters).sort().reduce((acc, itemKey) => {
      const value = nextFilters[itemKey];
      if (value !== undefined && value !== null && value !== '') acc[itemKey] = value;
      return acc;
    }, {}));
    const now = Date.now();
    if (!force && lastLoad.key === key && lastLoad.result && now - lastLoad.at < repeatLoadCacheMs) {
      return lastLoad.result;
    }
    if (!force && inFlightLoads.has(key)) return inFlightLoads.get(key);

    const promise = run('loading', async () => {
    const result = await api.list(nextFilters);
    store.setState({
      rows: Array.isArray(result.data) ? result.data : [],
      meta: result.meta || {},
      filters: nextFilters
    });
      lastLoad = { key, at: Date.now(), result };
    return result;
    }).finally(() => inFlightLoads.delete(key));
    inFlightLoads.set(key, promise);
    return promise;
  };

  const create = async (payload) => run('saving', async () => {
    const result = await api.create(payload);
    invalidateLoadCache();
    store.setState((state) => ({ rows: [result.data, ...state.rows].filter(Boolean) }));
    return result;
  });

  const update = async (id, payload) => run('saving', async () => {
    const result = await api.update(id, payload);
    invalidateLoadCache();
    store.setState((state) => ({
      rows: state.rows.map((row) => (row?.id === result.data?.id ? result.data : row)),
      current: state.current?.id === result.data?.id ? result.data : state.current
    }));
    return result;
  });

  const remove = async (id) => run('saving', async () => {
    const result = await api.delete(id);
    invalidateLoadCache();
    store.setState((state) => ({
      rows: state.rows.filter((row) => row?.id !== id),
      current: state.current?.id === id ? null : state.current
    }));
    return result;
  });

  return {
    ...store,
    load,
    create,
    update,
    delete: api.delete ? remove : undefined,
    setCurrent: (current) => store.setState({ current }),
    setFilters: (filters) => store.setState((state) => ({ filters: { ...state.filters, ...filters } })),
    clearError: () => store.setState({ error: null })
  };
};

export const createReadOnlyResourceStore = ({ api, initialFilters }) => {
  const { create, update, delete: remove, ...store } = createResourceStore({ api, initialFilters });
  return store;
};
