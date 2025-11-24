import axios from "axios";
import { startApiCall, endApiCall, getStore } from "@/store/storeManager";

const isDevelopment = import.meta.env.DEV;

const RETRYABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504];
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const api = axios.create({
  baseURL: `${import.meta.env.VITE_APP_BASE_URL || "http://192.168.0.119"}/api`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
  validateStatus: (status) => status >= 200 && status < 500,
  maxRedirects: 5,
  maxContentLength: 50 * 1024 * 1024,
  maxBodyLength: 50 * 1024 * 1024,
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const SENSITIVE_HEADERS = ['authorization', 'x-api-key', 'cookie'];
const SENSITIVE_DATA_KEYS = ['password', 'token', 'secret', 'api_key', 'apikey', 'access_token', 'refresh_token'];

const sanitizeForLogging = (obj, isHeader = false) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized = { ...obj };
  const keys = Object.keys(sanitized);
  
  keys.forEach(key => {
    const lowerKey = key.toLowerCase();
    
    if (isHeader && SENSITIVE_HEADERS.some(h => lowerKey.includes(h))) {
      sanitized[key] = '[REDACTED]';
    } else if (!isHeader && SENSITIVE_DATA_KEYS.some(k => lowerKey.includes(k))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeForLogging(sanitized[key], false);
    }
  });
  
  return sanitized;
};

const shouldRetry = (error, config, retryCount) => {
  if (retryCount >= MAX_RETRIES) return false;
  
  const method = config?.method?.toLowerCase();
  
  if (method === 'post' || method === 'put' || method === 'patch' || method === 'delete') {
    if (error.response?.status === 429) {
      return true;
    }
    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      return true;
    }
    return false;
  }
  
  if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
    return true;
  }
  
  if (error.response) {
    const status = error.response.status;
    return RETRYABLE_STATUS_CODES.includes(status);
  }
  
  if (error.request && !error.response) {
    return true;
  }
  
  return false;
};

api.interceptors.request.use(
  (config) => {
    startApiCall();

    if (!config._retryCount) {
      config._retryCount = 0;
    }

    const store = getStore();

    if (store?.getters.token) {
      if (store.getters.isTokenExpired) {
        store.dispatch("clearAuth");
      } else {
        config.headers.Authorization = `Bearer ${store.getters.token}`;
      }
    }

    if (store?.getters.currentCompanyId) {
      config.headers["X-Company-ID"] = store.getters.currentCompanyId;
    }

    if (config.method === "get" || config.method === "GET") {
      config.headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
      config.headers["Pragma"] = "no-cache";
      config.headers["Expires"] = "0";
    }

    if (isDevelopment) {
      const retryInfo = config._retryCount > 0 ? ` (retry ${config._retryCount})` : "";
      const logData = {};
      if (config.params) {
        logData.params = config.params;
      }
      if (config.data) {
        logData.data = sanitizeForLogging(config.data);
      }
      if (Object.keys(logData).length > 0 || config.headers) {
        logData.headers = sanitizeForLogging(config.headers, true);
      }
      console.log(`[API Request]${retryInfo} ${config.method?.toUpperCase()} ${config.url}`, Object.keys(logData).length > 0 ? logData : undefined);
    }

    return config;
  },
  (error) => {
    endApiCall();
    if (isDevelopment) {
      console.error("[API Request Error]", error);
    }
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    endApiCall();

    if (isDevelopment) {
      const status = response.status;
      const statusText = response.statusText;
      const method = response.config.method?.toUpperCase();
      const url = response.config.url;
      
      if (status >= 200 && status < 300) {
        console.log(`[API Success] ${method} ${url} - ${status} ${statusText}`, {
          data: response.data,
        });
      } else {
        console.warn(`[API Warning] ${method} ${url} - ${status} ${statusText}`, {
          data: response.data,
        });
      }
    }

    return response;
  },
  async (error) => {
    const config = error.config;

    if (isDevelopment) {
      const method = error.config?.method?.toUpperCase();
      const url = error.config?.url;
      const status = error.response?.status;
      const statusText = error.response?.statusText;

      if (error.code === "ECONNABORTED") {
        console.error(`[API Timeout] ${method} ${url} - Request timeout after ${error.config.timeout}ms`);
      } else if (error.response) {
        console.error(`[API Error] ${method} ${url} - ${status} ${statusText}`, {
          data: error.response.data,
          headers: error.response.headers,
        });
      } else if (error.request) {
        console.error(`[API Network Error] ${method} ${url} - No response received`, error.request);
      } else {
        console.error(`[API Error] ${method} ${url}`, error.message);
      }
    }

    if (error.response?.status === 401) {
      const store = getStore();
      if (store) {
        store.dispatch("clearAuth");
      }

      if (window.location.pathname !== "/auth/login") {
        window.location.href = "/auth/login";
      }
      return Promise.reject(error);
    }

    if (shouldRetry(error, config, config._retryCount || 0)) {
      const store = getStore();
      
      if (store?.getters.token && store.getters.isTokenExpired) {
        store.dispatch("clearAuth");
        return Promise.reject(error);
      }
      
      config._retryCount = (config._retryCount || 0) + 1;
      const delay = RETRY_DELAY * config._retryCount;

      if (isDevelopment) {
        console.log(`[API Retry] Retrying request (${config._retryCount}/${MAX_RETRIES}) after ${delay}ms`);
      }

      await sleep(delay);
      return api(config);
    }

    endApiCall();
    return Promise.reject(error);
  }
);

export const createCancelToken = () => {
  return axios.CancelToken.source();
};

export const isCancelError = (error) => {
  return axios.isCancel(error);
};

export default api;
