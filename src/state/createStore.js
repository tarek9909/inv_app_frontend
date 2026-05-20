export const createStore = (initialState) => {
  let state = { ...initialState };
  const listeners = new Set();

  const setState = (patch) => {
    const nextPatch = typeof patch === 'function' ? patch(state) : patch;
    state = { ...state, ...nextPatch };
    listeners.forEach((listener) => listener(state));
    return state;
  };

  return {
    getState: () => state,
    setState,
    reset: () => setState(initialState),
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
};
