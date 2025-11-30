import { eventBus } from "@/eventBus";
import { indexedDBStorage } from "./storage";

export const CACHE_KEY_PREFIXES = [
  "warehouses_",
  "cashRegisters_",
  "clients_",
  "clientCategories_",
  "products_",
  "services_",
  "categories_",
  "projects_",
  "users_",
  "companies_",
  "orders_",
  "sales_",
  "transactions_",
  "invoices_",
  "transfers_",
  "orderFields_",
  "orderCategories_",
  "receipts_",
  "writeoffs_",
  "movements_",
  "stocks_",
];

export const CACHE_PLAIN_KEYS = [
  "clientsData",
  "projectsData",
  "lastProductsData",
  "allProductsData",
];

async function invalidateIndexedDBKey(key) {
  try {
    await indexedDBStorage.removeItem(key);
  } catch (error) {
    console.warn(`Failed to invalidate IndexedDB key ${key}:`, error);
  }
}

export class CacheInvalidator {
  static removeKeyAndTimestamp(key) {
    let count = 0;
    try {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        count++;
      }
      const timestampKey = `${key}_timestamp`;
      if (localStorage.getItem(timestampKey)) {
        localStorage.removeItem(timestampKey);
        count++;
      }
    } catch (error) {
      if (error.name === "QuotaExceededError") {
        console.warn("localStorage quota exceeded, clearing cache");
        this.invalidateAll();
      }
    }
    return count;
  }

  static async invalidateByType(type, companyId = null) {
    const patterns = {
      currencies: ["currencies_cache"],
      units: ["units_cache"],
      orderStatuses: ["orderStatuses_cache", "order_status_categories_cache"],
      orderStatusCategories: [
        "order_status_categories_cache",
        "orderStatuses_cache",
      ],
      projectStatuses: ["projectStatuses_cache"],
      transactionCategories: ["transactionCategories_cache"],
      productStatuses: ["productStatuses_cache"],
      warehouses: ["warehouses_"],
      cashRegisters: ["cashRegisters_"],
      clients: ["clients_", "clientsData"],
      clientCategories: ["clientCategories_"],
      products: ["products_", "lastProductsData", "allProductsData"],
      services: ["services_"],
      categories: ["categories_"],
      projects: ["projects_", "projectsData"],
      users: ["users", "users_"],
      companies: ["companies_"],
      orders: ["orders_"],
      sales: ["sales_"],
      transactions: ["transactions_"],
      invoices: ["invoices_"],
      transfers: ["transfers_"],
      orderFields: ["orderFields_"],
      orderCategories: ["orderCategories_"],
      receipts: ["receipts_"],
      writeoffs: ["writeoffs_"],
      movements: ["movements_"],
      stocks: ["stocks_"],
    };

    const keysToRemove = patterns[type] || [];
    if (keysToRemove.length === 0) {
      eventBus.emit("cache:invalidate", { type });
      return 0;
    }

    const allKeys = Object.keys(localStorage);
    let removedCount = 0;
    const indexedDBKeys = new Set();

    keysToRemove.forEach((pattern) => {
      allKeys.forEach((key) => {
        if (pattern.endsWith("_")) {
          if (key.startsWith(pattern)) {
            removedCount += this.removeKeyAndTimestamp(key);
          }
        } else if (key.startsWith(pattern) || key === pattern) {
          removedCount += this.removeKeyAndTimestamp(key);
        }
      });

      if (!pattern.endsWith("_")) {
        removedCount += this.removeKeyAndTimestamp(pattern);
        if (CACHE_PLAIN_KEYS.includes(pattern)) {
          indexedDBKeys.add(pattern);
        }
      }
    });

    await Promise.all(
      Array.from(indexedDBKeys).map((key) => invalidateIndexedDBKey(key))
    );

    eventBus.emit("cache:invalidate", { type });

    return removedCount;
  }

  static invalidateByCompany(companyId) {
    let removedCount = 0;

    CACHE_KEY_PREFIXES.forEach((pattern) => {
      removedCount += this.removeKeyAndTimestamp(`${pattern}${companyId}`);
    });

    return removedCount;
  }

  static async invalidateAll() {
    const cacheKeys = this.getCacheKeys();
    let removedCount = 0;
    const indexedDBKeys = new Set();

    cacheKeys.forEach((key) => {
      try {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          removedCount++;
        }
        const timestampKey = `${key}_timestamp`;
        if (localStorage.getItem(timestampKey)) {
          localStorage.removeItem(timestampKey);
          removedCount++;
        }
        if (CACHE_PLAIN_KEYS.includes(key)) {
          indexedDBKeys.add(key);
        }
      } catch (error) {
        if (error.name === "QuotaExceededError") {
          console.warn("localStorage quota exceeded during invalidateAll");
        }
      }
    });

    await Promise.all(
      Array.from(indexedDBKeys).map((key) => invalidateIndexedDBKey(key))
    );

    return removedCount;
  }

  static getCacheKeys() {
    return Object.keys(localStorage).filter((key) => {
      if (key.includes("_cache") || key.includes("_timestamp")) {
        return true;
      }
      if (CACHE_KEY_PREFIXES.some((prefix) => key.startsWith(prefix))) {
        return true;
      }
      if (CACHE_PLAIN_KEYS.includes(key)) {
        return true;
      }
      return false;
    });
  }

  static dependencies = {
    sales: ["clients", "projects"],
    orders: ["clients", "projects"],
    transactions: ["clients", "projects", "cashRegisters"],
    receipts: ["clients"],
    writeoffs: [],
    movements: [],
    transfers: ["cashRegisters"],
    invoices: [],
  };

  static async invalidateCrud(type, companyId = null) {
    await this.invalidateByType(type, companyId);
    await this.invalidateDependencies(type, companyId);
  }

  static onCreate(type, companyId = null) {
    return this.invalidateCrud(type, companyId);
  }

  static onUpdate(type, companyId = null) {
    return this.invalidateCrud(type, companyId);
  }

  static onDelete(type, companyId = null) {
    return this.invalidateCrud(type, companyId);
  }

  static async invalidateDependencies(type, companyId = null) {
    const dependentTypes = this.dependencies[type] || [];
    await Promise.all(
      dependentTypes.map((dependentType) =>
        this.invalidateByType(dependentType, companyId)
      )
    );
  }

  static async onCompanyChange(_oldCompanyId, _newCompanyId) {
    return await this.invalidateAll();
  }

  static onUserChange() {
    return this.invalidateAll();
  }
}

export function companyScopedKey(prefix, companyId) {
  if (!prefix) throw new Error("companyScopedKey: prefix is required");
  if (!companyId) throw new Error("companyScopedKey: companyId is required");
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
  try {
    localStorage.setItem(timestampKey(key), Date.now().toString());
  } catch (error) {
    if (error.name === "QuotaExceededError") {
      console.warn("localStorage quota exceeded in touchKey");
    }
  }
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
