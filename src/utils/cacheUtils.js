/**
 * Утилиты для работы с кэшем в localStorage
 */

export default class CacheUtils {
  /**
   * Получить данные из кэша с проверкой TTL
   * @param {string} key - ключ кэша
   * @param {number} maxAge - максимальный возраст в миллисекундах
   * @returns {any|null} - данные или null если кэш устарел
   */
  static get(key, maxAge = 24 * 60 * 60 * 1000) {
    try {
      const cachedData = localStorage.getItem(key);
      const cacheTimestamp = localStorage.getItem(`${key}_timestamp`);
      
      if (!cachedData || !cacheTimestamp) {
        return null;
      }
      
      const now = Date.now();
      const age = now - parseInt(cacheTimestamp);
      
      if (age > maxAge) {
        // Кэш устарел, удаляем
        this.remove(key);
        return null;
      }
      
      return JSON.parse(cachedData);
    } catch (error) {
      console.error('Ошибка при чтении кэша:', error);
      return null;
    }
  }
  
  /**
   * Сохранить данные в кэш с временной меткой
   * @param {string} key - ключ кэша
   * @param {any} data - данные для сохранения
   */
  static set(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      localStorage.setItem(`${key}_timestamp`, Date.now().toString());
    } catch (error) {
      console.error('Ошибка при сохранении в кэш:', error);
    }
  }
  
  /**
   * Удалить данные из кэша
   * @param {string} key - ключ кэша
   */
  static remove(key) {
    localStorage.removeItem(key);
    localStorage.removeItem(`${key}_timestamp`);
  }
  
  /**
   * Очистить весь кэш приложения
   */
  static clearAll() {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes('_cache') || 
          key.includes('_timestamp') || 
          key.startsWith('warehouses_') || 
          key.startsWith('cashRegisters_') ||
          key.startsWith('clients_') ||
          key.startsWith('products_') ||
          key.startsWith('services_') ||
          key.startsWith('categories_') ||
          key.startsWith('projects_')) {
        localStorage.removeItem(key);
      }
    });
  }
  
  /**
   * Очистить кэш для конкретной компании
   * @param {number} companyId - ID компании
   */
  static clearCompanyCache(companyId) {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.endsWith(`_${companyId}`) || key.endsWith(`_${companyId}_timestamp`)) {
        localStorage.removeItem(key);
      }
    });
  }
  
  /**
   * Получить размер кэша в байтах
   */
  static getCacheSize() {
    let total = 0;
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes('_cache') || key.includes('_timestamp') || 
          key.startsWith('warehouses_') || key.startsWith('cashRegisters_') ||
          key.startsWith('clients_') || key.startsWith('products_') ||
          key.startsWith('services_') || key.startsWith('categories_') ||
          key.startsWith('projects_')) {
        total += localStorage.getItem(key).length;
      }
    });
    return total;
  }
}
