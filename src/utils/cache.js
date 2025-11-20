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

function getCurrentCompanyId() {
  try {
    const store = require('@/store').default;
    return store?.state?.currentCompany?.id || null;
  } catch {
    return null;
  }
}

export class CacheInvalidator {
  static removeKeyAndTimestamp(key) {
    let count = 0;
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      count++;
    }
    const timestampKey = `${key}_timestamp`;
    if (localStorage.getItem(timestampKey)) {
      localStorage.removeItem(timestampKey);
      count++;
    }
    return count;
  }

  static invalidateByType(type, companyId = null) {
    const currentCompanyId = companyId || getCurrentCompanyId();
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
      users: ['users', 'users_'],
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
    if (keysToRemove.length === 0) {
      eventBus.emit('cache:invalidate', { type });
      return 0;
    }

    const allKeys = Object.keys(localStorage);
    let removedCount = 0;

    keysToRemove.forEach(pattern => {
      allKeys.forEach(key => {
        let shouldRemove = false;
        
        if (pattern.endsWith('_') && currentCompanyId) {
          shouldRemove = key === `${pattern}${currentCompanyId}` || key.startsWith(`${pattern}${currentCompanyId}_`);
        } else if (key.startsWith(pattern) || key === pattern) {
          shouldRemove = !currentCompanyId || key.includes(`_company_${currentCompanyId}`) || !key.includes('_company_');
        }
        
        if (shouldRemove) {
          removedCount += this.removeKeyAndTimestamp(key);
        }
      });
      
      if (pattern.endsWith('_') && currentCompanyId) {
        removedCount += this.removeKeyAndTimestamp(`${pattern}${currentCompanyId}`);
      } else if (!pattern.endsWith('_')) {
        removedCount += this.removeKeyAndTimestamp(pattern);
      }
    });

    eventBus.emit('cache:invalidate', { type });

    return removedCount;
  }

  static invalidateByCompany(companyId) {
    let removedCount = 0;

    CACHE_KEY_PREFIXES.forEach(pattern => {
      removedCount += this.removeKeyAndTimestamp(`${pattern}${companyId}`);
    });

    return removedCount;
  }

  static invalidateAll() {
    const cacheKeys = this.getCacheKeys();
    let removedCount = 0;
    cacheKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        removedCount++;
      }
      const timestampKey = `${key}_timestamp`;
      if (localStorage.getItem(timestampKey)) {
        localStorage.removeItem(timestampKey);
        removedCount++;
      }
    });
    return removedCount;
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

  static invalidateCrud(type, companyId = null) {
    this.invalidateByType(type, companyId);
    if (companyId) {
      this.invalidateByCompany(companyId);
    }
    this.invalidateDependencies(type, companyId);
  }

  static onCreate(type, companyId = null) {
    this.invalidateCrud(type, companyId);
  }

  static onUpdate(type, companyId = null) {
    this.invalidateCrud(type, companyId);
  }

  static onDelete(type, companyId = null) {
    this.invalidateCrud(type, companyId);
  }

  static invalidateDependencies(type, companyId = null) {
    const dependentTypes = this.dependencies[type] || [];
    dependentTypes.forEach(dependentType => {
      this.invalidateByType(dependentType, companyId);
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

export default CacheInvalidator;

