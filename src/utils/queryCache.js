class QueryCache {
  constructor() {
    this.cache = new Map();
    this.timestamps = new Map();
    this.defaultTTL = 2 * 60 * 1000;
  }

  generateKey(prefix, params) {
    const sortedParams = Object.keys(params || {})
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {});
    
    return `${prefix}_${JSON.stringify(sortedParams)}`;
  }

  get(prefix, params, ttl = null) {
    const key = this.generateKey(prefix, params);
    const timestamp = this.timestamps.get(key);
    const maxAge = ttl || this.defaultTTL;

    if (!timestamp || Date.now() - timestamp > maxAge) {
      this.cache.delete(key);
      this.timestamps.delete(key);
      return null;
    }

    return this.cache.get(key) || null;
  }

  set(prefix, params, data) {
    const key = this.generateKey(prefix, params);
    this.cache.set(key, data);
    this.timestamps.set(key, Date.now());
  }

  invalidate(prefix) {
    const keysToDelete = [];
    
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => {
      this.cache.delete(key);
      this.timestamps.delete(key);
    });
    
    console.log(`🗑️ Инвалидировано ${keysToDelete.length} записей кэша для ${prefix}`);
  }

  clear() {
    const size = this.cache.size;
    this.cache.clear();
    this.timestamps.clear();
    console.log(`🗑️ Очищено ${size} записей кэша`);
  }

  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  cleanup() {
    const now = Date.now();
    const keysToDelete = [];

    for (const [key, timestamp] of this.timestamps.entries()) {
      if (now - timestamp > this.defaultTTL * 2) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => {
      this.cache.delete(key);
      this.timestamps.delete(key);
    });

    if (keysToDelete.length > 0) {
      console.log(`🧹 Автоочистка: удалено ${keysToDelete.length} устаревших записей`);
    }
  }
}

const queryCache = new QueryCache();

setInterval(() => {
  queryCache.cleanup();
}, 5 * 60 * 1000);

export default queryCache;
