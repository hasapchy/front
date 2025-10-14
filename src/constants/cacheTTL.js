/**
 * Централизованные константы TTL для кэширования
 * Используются в Store, CacheMonitor, CacheChecker
 */

export const CACHE_TTL = {
  // Данные с изображениями - долгое хранение
  products: 30 * 24 * 60 * 60 * 1000,           // 30 дней
  services: 30 * 24 * 60 * 60 * 1000,           // 30 дней
  allProducts: 30 * 24 * 60 * 60 * 1000,        // 30 дней (все товары для поиска)
  allProductsData: 30 * 24 * 60 * 60 * 1000,    // 30 дней (plain data)
  
  // Данные компании - среднее хранение
  warehouses: 10 * 60 * 1000,                   // 10 минут
  cashRegisters: 10 * 60 * 1000,                // 10 минут
  clients: 10 * 60 * 1000,                      // 10 минут
  categories: 10 * 60 * 1000,                   // 10 минут
  projects: 10 * 60 * 1000,                     // 10 минут
  
  // Глобальные справочники - долгое хранение
  units: 24 * 60 * 60 * 1000,                   // 24 часа
  currencies: 24 * 60 * 60 * 1000,              // 24 часа
  orderStatuses: 24 * 60 * 60 * 1000,           // 24 часа
  projectStatuses: 24 * 60 * 60 * 1000,         // 24 часа
  transactionCategories: 24 * 60 * 60 * 1000,   // 24 часа
  productStatuses: 24 * 60 * 60 * 1000,         // 24 часа
  
  // По умолчанию
  default: 10 * 60 * 1000                       // 10 минут
};

/**
 * Получить TTL для ключа кэша
 * @param {string} key - ключ кэша
 * @returns {number} - TTL в миллисекундах
 */
export function getCacheTTL(key) {
  // Проверяем по началу ключа
  for (const [type, ttl] of Object.entries(CACHE_TTL)) {
    if (key.startsWith(`${type}_`)) {
      return ttl;
    }
  }
  
  // Глобальные кэши (заканчиваются на _cache)
  if (key.endsWith('_cache')) {
    const type = key.replace('_cache', '');
    return CACHE_TTL[type] || CACHE_TTL.default;
  }
  
  // По умолчанию
  return CACHE_TTL.default;
}

export default CACHE_TTL;

