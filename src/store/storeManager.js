let storeInstance = null;

export const setStore = (store) => {
  storeInstance = store;
};

export const getStore = () => storeInstance;

export const startApiCall = () => {
  if (storeInstance) {
    storeInstance.dispatch('startApiCall');
  }
};

export const endApiCall = () => {
  if (storeInstance) {
    storeInstance.dispatch('endApiCall');
  }
};
