let storeInstance = null;

export const setStore = (store) => {
  storeInstance = store;
};

export const getStore = () => storeInstance;
