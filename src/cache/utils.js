export async function retryWithExponentialBackoff(
  fn,
  maxRetries = 3,
  initialDelay = 1000
) {
  if (typeof fn !== "function") {
    throw new Error("retryWithExponentialBackoff: fn must be a function");
  }

  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        const baseDelay = initialDelay * Math.pow(2, attempt);
        const jitter = Math.random() * 0.3 * baseDelay;
        const delay = Math.floor(baseDelay + jitter);
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            `⚠️ Попытка ${attempt + 1} не удалась, повторяю через ${delay}ms...`
          );
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

export function assertStorageAvailable(storage, cacheKeysToClear = [], testKey = "__vuex_test__") {
  if (!storage || typeof storage.setItem !== "function" || typeof storage.removeItem !== "function") {
    return false;
  }

  try {
    storage.setItem(testKey, testKey);
    storage.removeItem(testKey);
    return true;
  } catch (e) {
    if (cacheKeysToClear.length > 0) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Storage quota exceeded, clearing old cache");
      }
      try {
        cacheKeysToClear.forEach((key) => storage.removeItem(key));
        try {
          storage.setItem(testKey, testKey);
          storage.removeItem(testKey);
          return true;
        } catch {
          return false;
        }
      } catch {
        return false;
      }
    }
    return false;
  }
}

