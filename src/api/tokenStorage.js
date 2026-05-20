const MEMORY_KEY = 'stock_driver_auth_token';

let memoryToken = null;

const getStorage = () => {
  try {
    return globalThis.localStorage || null;
  } catch {
    return null;
  }
};

export const tokenStorage = {
  get() {
    const storage = getStorage();
    return storage?.getItem(MEMORY_KEY) || memoryToken;
  },
  set(token) {
    memoryToken = token || null;
    const storage = getStorage();
    if (storage && token) storage.setItem(MEMORY_KEY, token);
    if (storage && !token) storage.removeItem(MEMORY_KEY);
  },
  clear() {
    this.set(null);
  }
};
