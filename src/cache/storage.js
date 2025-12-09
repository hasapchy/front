import { CACHE_CONFIG } from "./config";

let db = null;
let dbOpenPromise = null;
const DB_NAME = CACHE_CONFIG.indexedDB.dbName;
const DB_VERSION = CACHE_CONFIG.indexedDB.dbVersion;
const STORE_NAME = CACHE_CONFIG.indexedDB.storeName;

function openDB() {
  if (db && db.objectStoreNames.contains(STORE_NAME)) {
    return Promise.resolve(db);
  }

  if (dbOpenPromise) {
    return dbOpenPromise;
  }

  dbOpenPromise = new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("IndexedDB is not supported"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    let upgradeBlocked = false;

    request.onerror = () => {
      dbOpenPromise = null;
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      db.onclose = () => {
        db = null;
        dbOpenPromise = null;
      };
      db.onerror = () => {
        db = null;
        dbOpenPromise = null;
      };
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };

    request.onblocked = () => {
      upgradeBlocked = true;
      if (process.env.NODE_ENV !== "production") {
        console.warn("IndexedDB upgrade blocked by other tabs. Please close other tabs and refresh.");
      }
      
      const checkInterval = setInterval(() => {
        if (!upgradeBlocked) {
          clearInterval(checkInterval);
          return;
        }
        
        const retryRequest = indexedDB.open(DB_NAME, DB_VERSION);
        retryRequest.onsuccess = () => {
          clearInterval(checkInterval);
          db = retryRequest.result;
          dbOpenPromise = Promise.resolve(db);
          resolve(db);
        };
        retryRequest.onerror = () => {
          clearInterval(checkInterval);
          reject(retryRequest.error);
        };
      }, 1000);
    };
  });

  return dbOpenPromise;
}

export const indexedDBStorage = {
  async getItem(key) {
    if (!key) {
      return null;
    }

    try {
      const database = await openDB();
      return new Promise((resolve, reject) => {
        const transaction = database.transaction([STORE_NAME], "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(key);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const result = request.result;
          resolve(result ? JSON.stringify(result) : null);
        };
      });
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("IndexedDB getItem error:", error);
      }
      return null;
    }
  },

  async setItem(key, value) {
    if (!key) {
      throw new Error("setItem: key is required");
    }

    try {
      const database = await openDB();
      return new Promise((resolve, reject) => {
        const transaction = database.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);

        let parsedValue;
        try {
          parsedValue = JSON.parse(value);
        } catch (parseError) {
          reject(
            new Error(
              `Failed to parse value for key ${key}: ${parseError.message}`
            )
          );
          return;
        }

        const request = store.put(parsedValue, key);

        transaction.onerror = () => {
          const error = transaction.error || request.error;
          reject(error || new Error("Transaction failed"));
        };

        transaction.onabort = () => {
          reject(new Error("Transaction aborted"));
        };

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      if (error.name === "QuotaExceededError") {
        if (process.env.NODE_ENV !== "production") {
          console.error("IndexedDB quota exceeded for key:", key);
        }
        throw new Error("Storage quota exceeded. Please clear some data.");
      }
      if (process.env.NODE_ENV !== "production") {
        console.warn("IndexedDB setItem error:", error);
      }
      throw error;
    }
  },

  async removeItem(key) {
    if (!key) {
      return;
    }

    try {
      const database = await openDB();
      return new Promise((resolve, reject) => {
        const transaction = database.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(key);

        transaction.onerror = () => {
          const error = transaction.error || request.error;
          reject(error || new Error("Transaction failed"));
        };

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("IndexedDB removeItem error:", error);
      }
      throw error;
    }
  },
};
