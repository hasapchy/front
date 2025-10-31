/**
 * Централизованные константы TTL для кэширования
 * Используются в Store, CacheMonitor, CacheChecker
 */

export const CACHE_TTL = {
  // Данные с изображениями - сокращено для актуальности
  products: 7 * 24 * 60 * 60 * 1000,            // ⬇️ 7 дней (было 30)
  services: 7 * 24 * 60 * 60 * 1000,            // ⬇️ 7 дней (было 30)
  allProducts: 7 * 24 * 60 * 60 * 1000,         // ⬇️ 7 дней (было 30)
  allProductsData: 7 * 24 * 60 * 60 * 1000,     // ⬇️ 7 дней (было 30)
  
  // Данные компании - среднее хранение
  warehouses: 10 * 60 * 1000,                   // 10 минут
  cashRegisters: 10 * 60 * 1000,                // 10 минут
  clients: 10 * 60 * 1000,                      // 10 минут
  categories: 10 * 60 * 1000,                   // 10 минут
  projects: 10 * 60 * 1000,                     // 10 минут
  
  // Глобальные справочники - сокращено для критичных данных
  units: 12 * 60 * 60 * 1000,                   // ⬇️ 12 часов (было 24)
  currencies: 12 * 60 * 60 * 1000,              // ⬇️ 12 часов (было 24)
  users: 12 * 60 * 60 * 1000,                   // ⬇️ 12 часов для сотрудников
  orderStatuses: 12 * 60 * 60 * 1000,           // ⬇️ 12 часов (было 24)
  projectStatuses: 12 * 60 * 60 * 1000,         // ⬇️ 12 часов (было 24)
  transactionCategories: 12 * 60 * 60 * 1000,   // ⬇️ 12 часов (было 24)
  productStatuses: 12 * 60 * 60 * 1000,         // ⬇️ 12 часов (было 24)
  
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

