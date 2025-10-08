/**
 * Универсальная система кэширования для запросов с параметрами
 * Используется для кэширования постраничных списков с фильтрами
 */

class QueryCache {
  constructor() {
    this.cache = new Map();
    this.timestamps = new Map();
    this.defaultTTL = 2 * 60 * 1000; // 2 минуты по умолчанию
  }

  /**
   * Генерирует ключ кэша из параметров запроса
   * @param {string} prefix - префикс (например, 'projects_list')
   * @param {object} params - параметры запроса
   * @returns {string} - ключ кэша
   */
  generateKey(prefix, params) {
    // Сортируем параметры для консистентности
    const sortedParams = Object.keys(params || {})
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {});
    
    return `${prefix}_${JSON.stringify(sortedParams)}`;
  }

  /**
   * Получить данные из кэша
   * @param {string} prefix - префикс запроса
   * @param {object} params - параметры запроса
   * @param {number} ttl - время жизни кэша в миллисекундах
   * @returns {any|null} - данные из кэша или null
   */
  get(prefix, params, ttl = null) {
    const key = this.generateKey(prefix, params);
    const timestamp = this.timestamps.get(key);
    const maxAge = ttl || this.defaultTTL;

    if (!timestamp || Date.now() - timestamp > maxAge) {
      // Кэш истёк, удаляем
      this.cache.delete(key);
      this.timestamps.delete(key);
      return null;
    }

    return this.cache.get(key) || null;
  }

  /**
   * Сохранить данные в кэш
   * @param {string} prefix - префикс запроса
   * @param {object} params - параметры запроса
   * @param {any} data - данные для кэширования
   */
  set(prefix, params, data) {
    const key = this.generateKey(prefix, params);
    this.cache.set(key, data);
    this.timestamps.set(key, Date.now());
  }

  /**
   * Инвалидировать кэш по префиксу
   * @param {string} prefix - префикс для инвалидации
   */
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

  /**
   * Очистить весь кэш
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    this.timestamps.clear();
    console.log(`🗑️ Очищено ${size} записей кэша`);
  }

  /**
   * Получить информацию о кэше
   * @returns {object} - статистика кэша
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Автоматическая очистка устаревшего кэша
   */
  cleanup() {
    const now = Date.now();
    const keysToDelete = [];

    for (const [key, timestamp] of this.timestamps.entries()) {
      if (now - timestamp > this.defaultTTL * 2) { // Удаляем если старше 2x TTL
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

// Singleton instance
const queryCache = new QueryCache();

// Автоматическая очистка каждые 5 минут
setInterval(() => {
  queryCache.cleanup();
}, 5 * 60 * 1000);

export default queryCache;
