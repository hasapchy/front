import { eventBus } from '@/eventBus';

export const CACHE_KEY_PREFIXES = [
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
  'orders_',
  'sales_',
  'transactions_',
  'invoices_',
  'transfers_',
  'orderFields_',
  'orderCategories_',
  'receipts_',
  'writeoffs_',
  'movements_',
  'stocks_'
];

export const CACHE_PLAIN_KEYS = [
  'clientsData',
  'projectsData',
  'lastProductsData',
  'allProductsData'
];

export default class CacheInvalidator {
  static dependencies = {
    sales: ['clients', 'projects'],
    orders: ['clients', 'projects'],
    transactions: ['clients', 'projects', 'cashRegisters'],
    receipts: ['clients'],
    writeoffs: [],
    movements: [],
    transfers: ['cashRegisters'],
    invoices: [],
  };

  static invalidateByType(type) {
    const patterns = {
      currencies: ['currencies_cache'],
      units: ['units_cache'],
      orderStatuses: ['orderStatuses_cache', 'order_status_categories_cache'],
      orderStatusCategories: ['order_status_categories_cache', 'orderStatuses_cache'],
      projectStatuses: ['projectStatuses_cache'],
      transactionCategories: ['transactionCategories_cache'],
      productStatuses: ['productStatuses_cache'],
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
      orders: ['orders_'],
      sales: ['sales_'],
      transactions: ['transactions_'],
      invoices: ['invoices_'],
      transfers: ['transfers_'],
      orderFields: ['orderFields_'],
      orderCategories: ['orderCategories_'],
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
      
      if (pattern.endsWith('_')) {
        const timestampKey = pattern.slice(0, -1) + '_timestamp';
        localStorage.removeItem(timestampKey);
      } else {
        localStorage.removeItem(`${pattern}_timestamp`);
      }
    });

    eventBus.emit('cache:invalidate', { type });

    return removedCount;
  }

  static invalidateByCompany(companyId) {
    const patterns = CACHE_KEY_PREFIXES;

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

  static invalidateAll() {
    const cacheKeys = this.getCacheKeys();
    cacheKeys.forEach(key => localStorage.removeItem(key));
    return cacheKeys.length;
  }

  static getCacheKeys() {
    return Object.keys(localStorage).filter(key => {
      if (key.includes('_cache') || key.includes('_timestamp')) {
        return true;
      }
      if (CACHE_KEY_PREFIXES.some(prefix => key.startsWith(prefix))) {
        return true;
      }
      if (CACHE_PLAIN_KEYS.includes(key)) {
        return true;
      }
      return false;
    });
  }

  static onCreate(type, companyId = null) {
    this.invalidateByType(type);
    if (companyId) {
      this.invalidateByCompany(companyId);
    }
    this.invalidateDependencies(type, companyId);
  }

  static onUpdate(type, companyId = null) {
    this.invalidateByType(type);
    if (companyId) {
      this.invalidateByCompany(companyId);
    }
    this.invalidateDependencies(type, companyId);
  }

  static onDelete(type, companyId = null) {
    this.invalidateByType(type);
    if (companyId) {
      this.invalidateByCompany(companyId);
    }
    this.invalidateDependencies(type, companyId);
  }

  static invalidateDependencies(type, companyId = null) {
    const dependentTypes = this.dependencies[type] || [];
    dependentTypes.forEach(dependentType => {
      this.invalidateByType(dependentType);
      if (companyId) {
        this.invalidateByCompany(companyId);
      }
    });
  }

  static onCompanyChange(_oldCompanyId, _newCompanyId) {
  }

  static onUserChange() {
    this.invalidateAll();
  }
}

export function companyScopedKey(prefix, companyId) {
  if (!prefix) throw new Error('companyScopedKey: prefix is required');
  if (!companyId) throw new Error('companyScopedKey: companyId is required');
  return `${prefix}_${companyId}`;
}

export function timestampKey(key) {
  return `${key}_timestamp`;
}

export function isFreshByKey(key, ttlMs) {
  const tsKey = timestampKey(key);
  const tsStr = localStorage.getItem(tsKey);
  if (!tsStr) return false;
  const ts = parseInt(tsStr);
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts <= ttlMs;
}

export function touchKey(key) {
  localStorage.setItem(timestampKey(key), Date.now().toString());
}

export function clearKey(key) {
  localStorage.removeItem(key);
  localStorage.removeItem(timestampKey(key));
}

export function isCompanyCacheFresh(prefix, companyId, ttlMs) {
  const key = companyScopedKey(prefix, companyId);
  return isFreshByKey(key, ttlMs);
}

export function touchCompanyCache(prefix, companyId) {
  const key = companyScopedKey(prefix, companyId);
  touchKey(key);
}

export function clearCompanyCache(prefix, companyId) {
  const key = companyScopedKey(prefix, companyId);
  clearKey(key);
}