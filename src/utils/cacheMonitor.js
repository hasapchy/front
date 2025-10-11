/**
 * Мониторинг кэша localStorage
 */
import { getCacheTTL } from '@/constants/cacheTTL';

export default class CacheMonitor {
  static MAX_CACHE_SIZE = 5 * 1024 * 1024; // 5MB
  static WARNING_SIZE = 3 * 1024 * 1024; // 3MB

  /**
   * Получить информацию о кэше
   */
  static getCacheInfo() {
    const cacheKeys = this.getCacheKeys();
    let totalSize = 0;
    const details = {};

    cacheKeys.forEach(key => {
      const value = localStorage.getItem(key);
      const size = value ? value.length : 0;
      totalSize += size;
      
      details[key] = {
        size: size,
        sizeKB: Math.round(size / 1024 * 100) / 100,
        timestamp: this.getCacheTimestamp(key)
      };
    });

    return {
      totalSize: totalSize,
      totalSizeKB: Math.round(totalSize / 1024 * 100) / 100,
      totalSizeMB: Math.round(totalSize / (1024 * 1024) * 100) / 100,
      keyCount: cacheKeys.length,
      details: details,
      status: this.getCacheStatus(totalSize)
    };
  }

  /**
   * Получить все ключи кэша
   */
  static getCacheKeys() {
    return Object.keys(localStorage).filter(key => 
      key.includes('_cache') || 
      key.includes('_timestamp') ||
      key.startsWith('warehouses_') ||
      key.startsWith('cashRegisters_') ||
      key.startsWith('clients_') ||
      key.startsWith('products_') ||
      key.startsWith('services_') ||
      key.startsWith('categories_') ||
      key.startsWith('projects_')
    );
  }

  /**
   * Получить временную метку кэша
   */
  static getCacheTimestamp(key) {
    if (key.includes('_timestamp')) {
      return parseInt(localStorage.getItem(key));
    }
    
    const timestampKey = `${key}_timestamp`;
    const timestamp = localStorage.getItem(timestampKey);
    return timestamp ? parseInt(timestamp) : null;
  }

  /**
   * Получить статус кэша
   */
  static getCacheStatus(size) {
    if (size > this.MAX_CACHE_SIZE) {
      return { level: 'error', message: 'Кэш превышает максимальный размер' };
    } else if (size > this.WARNING_SIZE) {
      return { level: 'warning', message: 'Кэш приближается к максимальному размеру' };
    } else {
      return { level: 'ok', message: 'Размер кэша в норме' };
    }
  }

  /**
   * Проверить устаревшие кэши
   */
  static getExpiredCaches() {
    const now = Date.now();
    const expired = [];
    const cacheKeys = this.getCacheKeys().filter(key => !key.includes('_timestamp'));

    cacheKeys.forEach(key => {
      const timestamp = this.getCacheTimestamp(key);
      if (timestamp) {
        const age = now - timestamp;
        const ttl = this.getCacheTTL(key);
        
        if (age > ttl) {
          expired.push({
            key: key,
            age: age,
            ageMinutes: Math.round(age / (1000 * 60)),
            ttl: ttl,
            ttlMinutes: Math.round(ttl / (1000 * 60))
          });
        }
      }
    });

    return expired;
  }

  /**
   * Получить TTL для ключа кэша
   */
  static getCacheTTL(key) {
    // Используем централизованную функцию
    return getCacheTTL(key);
  }

  /**
   * Очистить устаревшие кэши
   */
  static clearExpiredCaches() {
    const expired = this.getExpiredCaches();
    let clearedCount = 0;

    expired.forEach(cache => {
      localStorage.removeItem(cache.key);
      localStorage.removeItem(`${cache.key}_timestamp`);
      clearedCount++;
    });

    return { clearedCount, expired };
  }

  /**
   * Очистить кэш по размеру (удалить самые старые)
   */
  static clearOldestCaches(targetSize) {
    const cacheKeys = this.getCacheKeys().filter(key => !key.includes('_timestamp'));
    const caches = [];

    cacheKeys.forEach(key => {
      const timestamp = this.getCacheTimestamp(key);
      const size = localStorage.getItem(key)?.length || 0;
      
      if (timestamp) {
        caches.push({ key, timestamp, size });
      }
    });

    // Сортируем по времени создания (старые первыми)
    caches.sort((a, b) => a.timestamp - b.timestamp);

    let currentSize = this.getCacheInfo().totalSize;
    let clearedCount = 0;

    for (const cache of caches) {
      if (currentSize <= targetSize) break;
      
      localStorage.removeItem(cache.key);
      localStorage.removeItem(`${cache.key}_timestamp`);
      currentSize -= cache.size;
      clearedCount++;
    }

    return { clearedCount, newSize: currentSize };
  }

  /**
   * Автоматическая очистка кэша
   */
  static autoCleanup() {
    const info = this.getCacheInfo();
    
    if (info.status.level === 'error') {
      // Критический размер - очищаем до 2MB
      const result = this.clearOldestCaches(2 * 1024 * 1024);
      console.warn(`🚨 Автоочистка кэша: удалено ${result.clearedCount} записей, новый размер: ${Math.round(result.newSize / 1024)}KB`);
      return result;
    } else if (info.status.level === 'warning') {
      // Предупреждение - очищаем устаревшие
      const result = this.clearExpiredCaches();
      if (result.clearedCount > 0) {
        // Очищено устаревших кэшей
      }
      return result;
    }

    return { clearedCount: 0 };
  }

  /**
   * Вывести отчет в консоль
   */
  static printReport() {
    const info = this.getCacheInfo();
    const expired = this.getExpiredCaches();

    return {
      info: info,
      expired: expired
    };
  }

  /**
   * Начать мониторинг (вызывать периодически)
   */
  static startMonitoring(intervalMs = 60000) { // каждую минуту
    return setInterval(() => {
      this.autoCleanup();
    }, intervalMs);
  }
}
