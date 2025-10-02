/**
 * Инвалидация кэша при изменении данных
 */

export default class CacheInvalidator {
  /**
   * Инвалидировать кэш по типу данных
   */
  static invalidateByType(type) {
    const patterns = {
      // Глобальные кэши
      currencies: ['currencies_cache'],
      units: ['units_cache'],
      orderStatuses: ['orderStatuses_cache'],
      projectStatuses: ['projectStatuses_cache'],
      transactionCategories: ['transactionCategories_cache'],
      productStatuses: ['productStatuses_cache'],
      
      // Данные компании
      warehouses: ['warehouses_'],
      cashRegisters: ['cashRegisters_'],
      clients: ['clients_'],
      products: ['products_'],
      services: ['services_'],
      categories: ['categories_'],
      projects: ['projects_']
    };

    const keysToRemove = patterns[type] || [];
    let removedCount = 0;

    keysToRemove.forEach(pattern => {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(pattern) || key === pattern) {
          localStorage.removeItem(key);
          localStorage.removeItem(`${key}_timestamp`);
          removedCount++;
        }
      });
    });

    return removedCount;
  }

  /**
   * Инвалидировать кэш для конкретной компании
   */
  static invalidateByCompany(companyId) {
    const patterns = [
      'warehouses_',
      'cashRegisters_',
      'clients_',
      'products_',
      'services_',
      'categories_',
      'projects_'
    ];

    let removedCount = 0;

    patterns.forEach(pattern => {
      const key = `${pattern}${companyId}`;
      const timestampKey = `${key}_timestamp`;
      
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        removedCount++;
      }
      
      if (localStorage.getItem(timestampKey)) {
        localStorage.removeItem(timestampKey);
        removedCount++;
      }
    });

    return removedCount;
  }

  /**
   * Инвалидировать все кэши
   */
  static invalidateAll() {
    const cacheKeys = Object.keys(localStorage).filter(key => 
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

    cacheKeys.forEach(key => localStorage.removeItem(key));
    
    return cacheKeys.length;
  }

  /**
   * Инвалидировать кэш при создании записи
   */
  static onCreate(type, companyId = null) {
    this.invalidateByType(type);
    if (companyId) {
      this.invalidateByCompany(companyId);
    }
  }

  /**
   * Инвалидировать кэш при обновлении записи
   */
  static onUpdate(type, companyId = null) {
    this.invalidateByType(type);
    if (companyId) {
      this.invalidateByCompany(companyId);
    }
  }

  /**
   * Инвалидировать кэш при удалении записи
   */
  static onDelete(type, companyId = null) {
    this.invalidateByType(type);
    if (companyId) {
      this.invalidateByCompany(companyId);
    }
  }

  /**
   * Инвалидировать кэш при смене компании
   */
  static onCompanyChange(oldCompanyId, newCompanyId) {
    // Очищаем данные старой компании из store
    // (это делается в store, здесь только логируем)
  }

  /**
   * Инвалидировать кэш при изменении пользователя
   */
  static onUserChange() {
    // При смене пользователя очищаем все кэши
    this.invalidateAll();
  }
}
