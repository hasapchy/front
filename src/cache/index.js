export { CACHE_CONFIG } from './config';

export { 
  CacheInvalidator,
  CACHE_KEY_PREFIXES,
  CACHE_PLAIN_KEYS,
  companyScopedKey,
  timestampKey,
  isFreshByKey,
  touchKey,
  clearKey,
  isCompanyCacheFresh,
  touchCompanyCache,
  clearCompanyCache
} from './invalidator';

export { indexedDBStorage } from './storage';

export {
  loadGlobalReference,
  loadCompanyScopedData,
  restoreDtoFromPlainData
} from './loader';

export {
  retryWithExponentialBackoff,
  assertStorageAvailable
} from './utils';

export { CacheInvalidator as default } from './invalidator';

