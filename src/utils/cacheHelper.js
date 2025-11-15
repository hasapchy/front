import store from '@/store';

export const queryCache = {
  get(prefix, params, ttl = 120000) {
    return store.dispatch('getQueryCache', { prefix, params, ttl });
  },
  
  set(prefix, params, data) {
    return store.dispatch('setQueryCache', { prefix, params, data });
  },
  
  invalidate(prefix, companyId = null) {
    return store.dispatch('invalidateQueryCache', { prefix, companyId });
  },
  
  invalidateByCompany(companyId) {
    return store.dispatch('invalidateQueryCache', { companyId });
  }
};

export default queryCache;