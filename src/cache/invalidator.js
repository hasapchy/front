import { eventBus } from "@/eventBus";
import { indexedDBStorage } from "./storage";
import { CACHE_CONFIG } from "./config";

export const CACHE_KEY_PREFIXES = CACHE_CONFIG.keyPrefixes;
export const CACHE_PLAIN_KEYS = CACHE_CONFIG.plainKeys;

let isInvalidatingAll = false;

async function invalidateIndexedDBKey(key) {
  try {
    await indexedDBStorage.removeItem(key);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`Failed to invalidate IndexedDB key ${key}:`, error);
    }
  }
}

export class CacheInvalidator {
  static removeKeyAndTimestamp(key, skipRecursionCheck = false) {
    if (!key) {
      return 0;
    }

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
      if (
        error.name === "QuotaExceededError" &&
        !skipRecursionCheck &&
        !isInvalidatingAll
      ) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("localStorage quota exceeded, clearing cache");
        }
        isInvalidatingAll = true;
        this.invalidateAll().finally(() => {
          isInvalidatingAll = false;
        });
      }
    }
    return count;
  }

  static async invalidateByType(type, companyId = null) {
    if (!type) {
      return 0;
    }

    const keysToRemove = CACHE_CONFIG.invalidationPatterns[type] || [];
    if (keysToRemove.length === 0) {
      eventBus.emit("cache:invalidate", { type, companyId });
      return 0;
    }

    const allKeys = Object.keys(localStorage);
    let removedCount = 0;
    const indexedDBKeys = new Set();
    const keysToProcess = new Set();

    const shouldIncludeKey = (key) => {
      return companyId === null || key.includes(`_${companyId}`) || key.includes(`_${companyId}_`);
    };

    keysToRemove.forEach((pattern) => {
      if (!pattern) {
        return;
      }

      const isPrefixPattern = pattern.endsWith("_");

      allKeys.forEach((key) => {
        const matches = isPrefixPattern
          ? key.startsWith(pattern)
          : key === pattern || key.startsWith(pattern);
        
        if (matches && shouldIncludeKey(key)) {
          keysToProcess.add(key);
        }
      });

      if (!isPrefixPattern) {
        keysToProcess.add(pattern);
        if (CACHE_PLAIN_KEYS.includes(pattern)) {
          indexedDBKeys.add(pattern);
        }
      }
    });

    keysToProcess.forEach((key) => {
      removedCount += this.removeKeyAndTimestamp(key);
    });

    await Promise.all(
      Array.from(indexedDBKeys).map((key) => invalidateIndexedDBKey(key))
    );

    eventBus.emit("cache:invalidate", { type, companyId });

    return removedCount;
  }

  static invalidateByCompany(companyId) {
    if (!companyId) {
      return 0;
    }

    let removedCount = 0;

    CACHE_KEY_PREFIXES.forEach((pattern) => {
      removedCount += this.removeKeyAndTimestamp(`${pattern}${companyId}`);
    });

    return removedCount;
  }

  static async invalidateAll() {
    if (isInvalidatingAll) {
      return 0;
    }

    isInvalidatingAll = true;
    try {
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
          if (
            error.name === "QuotaExceededError" &&
            process.env.NODE_ENV !== "production"
          ) {
            console.warn("localStorage quota exceeded during invalidateAll");
          }
        }
      });

      await Promise.all(
        Array.from(indexedDBKeys).map((key) => invalidateIndexedDBKey(key))
      );

      return removedCount;
    } finally {
      isInvalidatingAll = false;
    }
  }

  static getCacheKeys() {
    try {
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
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Error getting cache keys:", error);
      }
      return [];
    }
  }

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
    if (!type) {
      return;
    }

    const dependentTypes = CACHE_CONFIG.dependencies[type] || [];
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
  if (!key) return false;

  try {
    const tsKey = timestampKey(key);
    const tsStr = localStorage.getItem(tsKey);
    if (!tsStr) return false;
    const ts = parseInt(tsStr, 10);
    if (Number.isNaN(ts)) return false;
    return Date.now() - ts <= ttlMs;
  } catch (error) {
    return false;
  }
}

export function touchKey(key) {
  if (!key) return;

  try {
    localStorage.setItem(timestampKey(key), Date.now().toString());
  } catch (error) {
    if (error.name === "QuotaExceededError" && process.env.NODE_ENV !== "production") {
      console.warn("localStorage quota exceeded in touchKey");
    }
  }
}

export function clearKey(key) {
  if (!key) return;

  try {
    localStorage.removeItem(key);
    localStorage.removeItem(timestampKey(key));
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Error clearing key:", error);
    }
  }
}

export function isCompanyCacheFresh(prefix, companyId, ttlMs) {
  try {
    const key = companyScopedKey(prefix, companyId);
    return isFreshByKey(key, ttlMs);
  } catch (error) {
    return false;
  }
}

export function touchCompanyCache(prefix, companyId) {
  try {
    const key = companyScopedKey(prefix, companyId);
    touchKey(key);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Error touching company cache:", error);
    }
  }
}

export function clearCompanyCache(prefix, companyId) {
  try {
    const key = companyScopedKey(prefix, companyId);
    clearKey(key);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Error clearing company cache:", error);
    }
  }
}
