import { useState, useEffect } from 'react';

export function useStore(store) {
  const [state, setState] = useState(store.getState());

  useEffect(() => {
    const unsubscribe = store.subscribe((newState) => {
      setState(newState);
    });
    return () => unsubscribe();
  }, [store]);

  return state;
}
