/**
 * Утилита для проверки состояния кэша
 */

export default class CacheChecker {
  /**
   * Проверить все кэшированные данные
   */
  static checkAllCaches() {
    const caches = {
      // Глобальные кэши (24 часа)
      currencies: this.checkCache('currencies_cache'),
      units: this.checkCache('units_cache'),
      orderStatuses: this.checkCache('orderStatuses_cache'),
      projectStatuses: this.checkCache('projectStatuses_cache'),
      transactionCategories: this.checkCache('transactionCategories_cache'),
      productStatuses: this.checkCache('productStatuses_cache'),
    };

    // Кэши по компаниям (10 минут)
    const companyCaches = this.checkCompanyCaches();

    return {
      global: caches,
      companies: companyCaches,
      summary: this.getSummary(caches, companyCaches)
    };
  }

  /**
   * Проверить конкретный кэш
   */
  static checkCache(key, maxAge = 24 * 60 * 60 * 1000) {
    try {
      const data = localStorage.getItem(key);
      const timestamp = localStorage.getItem(`${key}_timestamp`);
      
      if (!data || !timestamp) {
        return { exists: false, age: null, size: 0 };
      }

      const now = Date.now();
      const age = now - parseInt(timestamp);
      const isExpired = age > maxAge;
      const size = data.length;

      return {
        exists: true,
        age: age,
        ageMinutes: Math.round(age / (1000 * 60)),
        ageHours: Math.round(age / (1000 * 60 * 60)),
        isExpired: isExpired,
        size: size,
        sizeKB: Math.round(size / 1024 * 100) / 100
      };
    } catch (error) {
      return { exists: false, error: error.message };
    }
  }

  /**
   * Проверить кэши по компаниям
   */
  static checkCompanyCaches() {
    const companies = {};
    const keys = Object.keys(localStorage);
    
    // Находим все компании
    const companyIds = new Set();
    keys.forEach(key => {
      const match = key.match(/^(\w+)_(\d+)$/);
      if (match) {
        companyIds.add(match[2]);
      }
    });

    // Проверяем кэши для каждой компании
    companyIds.forEach(companyId => {
      companies[companyId] = {
        warehouses: this.checkCache(`warehouses_${companyId}`, 10 * 60 * 1000),
        cashRegisters: this.checkCache(`cashRegisters_${companyId}`, 10 * 60 * 1000),
        clients: this.checkCache(`clients_${companyId}`, 10 * 60 * 1000),
        products: this.checkCache(`products_${companyId}`, 10 * 60 * 1000),
        services: this.checkCache(`services_${companyId}`, 10 * 60 * 1000),
        categories: this.checkCache(`categories_${companyId}`, 10 * 60 * 1000),
        projects: this.checkCache(`projects_${companyId}`, 10 * 60 * 1000),
      };
    });

    return companies;
  }

  /**
   * Получить сводку по кэшам
   */
  static getSummary(globalCaches, companyCaches) {
    const totalSize = Object.values(globalCaches).reduce((sum, cache) => sum + (cache.size || 0), 0);
    const companyCount = Object.keys(companyCaches).length;
    const expiredCount = Object.values(globalCaches).filter(cache => cache.isExpired).length;
    
    return {
      totalSize: totalSize,
      totalSizeKB: Math.round(totalSize / 1024 * 100) / 100,
      companyCount: companyCount,
      expiredCount: expiredCount,
      totalCaches: Object.keys(globalCaches).length + Object.values(companyCaches).reduce((sum, company) => sum + Object.keys(company).length, 0)
    };
  }

  /**
   * Очистить все кэши
   */
  static clearAllCaches() {
    const keys = Object.keys(localStorage);
    let clearedCount = 0;
    
    keys.forEach(key => {
      if (key.includes('_cache') || key.includes('_timestamp') || 
          key.startsWith('warehouses_') || key.startsWith('cashRegisters_') ||
          key.startsWith('clients_') || key.startsWith('products_') ||
          key.startsWith('services_') || key.startsWith('categories_') ||
          key.startsWith('projects_')) {
        localStorage.removeItem(key);
        clearedCount++;
      }
    });

    return clearedCount;
  }

  /**
   * Вывести отчет в консоль
   */
  static printReport() {
    const report = this.checkAllCaches();
    
    console.log('=== ОТЧЕТ ПО КЭШУ ===');
    console.log('Глобальные кэши:');
    Object.entries(report.global).forEach(([name, cache]) => {
      if (cache.exists) {
        console.log(`  ${name}: ${cache.sizeKB}KB, возраст: ${cache.ageMinutes}мин (${cache.isExpired ? 'УСТАРЕЛ' : 'активен'})`);
      } else {
        console.log(`  ${name}: не найден`);
      }
    });

    console.log('\nКэши по компаниям:');
    Object.entries(report.companies).forEach(([companyId, caches]) => {
      console.log(`  Компания ${companyId}:`);
      Object.entries(caches).forEach(([type, cache]) => {
        if (cache.exists) {
          console.log(`    ${type}: ${cache.sizeKB}KB, возраст: ${cache.ageMinutes}мин (${cache.isExpired ? 'УСТАРЕЛ' : 'активен'})`);
        } else {
          console.log(`    ${type}: не найден`);
        }
      });
    });

    console.log('\nСводка:');
    console.log(`  Общий размер: ${report.summary.totalSizeKB}KB`);
    console.log(`  Количество компаний: ${report.summary.companyCount}`);
    console.log(`  Устаревших кэшей: ${report.summary.expiredCount}`);
    console.log(`  Всего кэшей: ${report.summary.totalCaches}`);
  }
}
