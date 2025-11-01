/**
 * Инвалидация кэша при изменении данных
 */

import { eventBus } from '@/eventBus';

export default class CacheInvalidator {
  /**
   * Зависимости между типами кэша
   * Когда инвалидируется тип из ключа, автоматически инвалидируются типы из значения
   * Согласно BALANCE_LOGIC_TZ.md: все операции (sales, orders, transactions, receipts) 
   * влияют на баланс клиента через таблицу transactions
   */
  static dependencies = {
    // При изменении продаж/заказов/транзакций/оприходований -> инвалидировать клиентов
    sales: ['clients', 'projects'],
    orders: ['clients', 'projects'],
    transactions: ['clients', 'projects', 'cashRegisters'],
    receipts: ['clients'], // поставщики тоже клиенты
    writeoffs: [],
    movements: [],
    transfers: ['cashRegisters'], // переводы между кассами
    invoices: [], // счета не влияют на баланс напрямую
  };

  /**
   * Инвалидировать кэш по типу данных
   */
  static invalidateByType(type) {
    const patterns = {
      // Глобальные кэши
      currencies: ['currencies_cache'],
      units: ['units_cache'],
      orderStatuses: ['orderStatuses_cache', 'order_status_categories_cache'],
      orderStatusCategories: ['order_status_categories_cache', 'orderStatuses_cache'],
      projectStatuses: ['projectStatuses_cache'],
      transactionCategories: ['transactionCategories_cache'],
      productStatuses: ['productStatuses_cache'],
      
      // Данные компании (справочники)
      warehouses: ['warehouses_'],
      cashRegisters: ['cashRegisters_'],
      clients: ['clients_', 'clientsData'],
      clientCategories: ['clientCategories_'],
      products: ['products_', 'lastProductsData', 'allProductsData'],
      services: ['services_'],
      categories: ['categories_'],
      projects: ['projects_', 'projectsData'],
      users: ['users_'],
      companies: ['companies_'],
      
      // Данные компании (транзакционные)
      orders: ['orders_'],
      sales: ['sales_'],
      transactions: ['transactions_'],
      invoices: ['invoices_'],
      transfers: ['transfers_'],
      orderFields: ['orderFields_'],
      orderCategories: ['orderCategories_'],
      
      // Складские операции
      receipts: ['receipts_'],
      writeoffs: ['writeoffs_'],
      movements: ['movements_'],
      stocks: ['stocks_']
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
      
      // ✅ Также удаляем timestamp для справочников без суффикса компании
      // Например: categories_timestamp, warehouses_timestamp и т.д.
      if (pattern.endsWith('_')) {
        const timestampKey = pattern.slice(0, -1) + '_timestamp'; // categories_ -> categories_timestamp
        localStorage.removeItem(timestampKey);
      } else {
        localStorage.removeItem(`${pattern}_timestamp`);
      }
    });

    // ✅ Отправляем событие об инвалидации кэша для очистки Vuex Store
    eventBus.emit('cache:invalidate', { type });

    return removedCount;
  }

  /**
   * Инвалидировать кэш для конкретной компании
   */
  static invalidateByCompany(companyId) {
    const patterns = [
      // Справочники
      'warehouses_',
      'cashRegisters_',
      'clients_',
      'clientCategories_',
      'products_',
      'services_',
      'categories_',
      'projects_',
      'users_',
      'companies_',
      // Транзакционные данные
      'orders_',
      'sales_',
      'transactions_',
      'invoices_',
      'transfers_',
      'orderFields_',
      'orderCategories_',
      // Складские операции
      'receipts_',
      'writeoffs_',
      'movements_',
      'stocks_'
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
      // Справочники
      key.startsWith('warehouses_') ||
      key.startsWith('cashRegisters_') ||
      key.startsWith('clients_') ||
      key.startsWith('products_') ||
      key.startsWith('services_') ||
      key.startsWith('categories_') ||
      key.startsWith('projects_') ||
      key.startsWith('users_') ||
      key.startsWith('companies_') ||
      // Транзакционные данные
      key.startsWith('orders_') ||
      key.startsWith('sales_') ||
      key.startsWith('transactions_') ||
      key.startsWith('invoices_') ||
      key.startsWith('transfers_') ||
      key.startsWith('orderFields_') ||
      key.startsWith('orderCategories_') ||
      // Складские операции
      key.startsWith('receipts_') ||
      key.startsWith('writeoffs_') ||
      key.startsWith('movements_') ||
      key.startsWith('stocks_') ||
      // Plain data для кэширования (Store)
      key === 'clientsData' ||
      key === 'projectsData' ||
      key === 'lastProductsData' ||
      key === 'allProductsData'
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
    
    // Инвалидировать зависимые типы
    this.invalidateDependencies(type, companyId);
  }

  /**
   * Инвалидировать кэш при обновлении записи
   */
  static onUpdate(type, companyId = null) {
    this.invalidateByType(type);
    if (companyId) {
      this.invalidateByCompany(companyId);
    }
    
    // Инвалидировать зависимые типы
    this.invalidateDependencies(type, companyId);
  }

  /**
   * Инвалидировать кэш при удалении записи
   */
  static onDelete(type, companyId = null) {
    this.invalidateByType(type);
    if (companyId) {
      this.invalidateByCompany(companyId);
    }
    
    // Инвалидировать зависимые типы
    this.invalidateDependencies(type, companyId);
  }

  /**
   * Инвалидировать зависимые типы кэша
   */
  static invalidateDependencies(type, companyId = null) {
    const dependentTypes = this.dependencies[type] || [];
    
    dependentTypes.forEach(dependentType => {
      this.invalidateByType(dependentType);
      if (companyId) {
        this.invalidateByCompany(companyId);
      }
    });
  }

  /**
   * Инвалидировать кэш при смене компании
   */
  static onCompanyChange(_oldCompanyId, _newCompanyId) {
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
