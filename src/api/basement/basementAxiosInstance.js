import axios from "axios";
import BasementAuthController from "./BasementAuthController";
import store from "@/store";

const isDevelopment = import.meta.env.DEV;

const RETRYABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504];
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const basementApi = axios.create({
  baseURL: `${import.meta.env.VITE_APP_BASE_URL}/api/basement`,
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

basementApi.interceptors.request.use(
  (config) => {
    if (!config._retryCount) {
      config._retryCount = 0;
    }

    if (store?.getters.token) {
      if (store.getters.isTokenExpired) {
        store.dispatch('clearAuth');
      } else {
        config.headers.Authorization = `Bearer ${store.getters.token}`;
      }
    }
    
    if (store?.getters.currentCompanyId) {
      config.headers['X-Company-ID'] = store.getters.currentCompanyId;
    } else {
      const defaultCompanyId = import.meta.env.VITE_BASEMENT_DEFAULT_COMPANY_ID || '1';
      config.headers['X-Company-ID'] = defaultCompanyId;
    }

    if (isDevelopment) {
      const retryInfo = config._retryCount > 0 ? ` (retry ${config._retryCount})` : "";
      console.log(`[Basement API Request]${retryInfo} ${config.method?.toUpperCase()} ${config.url}`, {
        params: config.params,
        data: sanitizeForLogging(config.data),
        headers: sanitizeForLogging(config.headers, true),
      });
    }
    
    return config;
  },
  (error) => {
    if (isDevelopment) {
      console.error("[Basement API Request Error]", error);
    }
    return Promise.reject(error);
  }
);

basementApi.interceptors.response.use(
  (response) => {
    if (isDevelopment) {
      const status = response.status;
      const statusText = response.statusText;
      const method = response.config.method?.toUpperCase();
      const url = response.config.url;
      
      if (status >= 200 && status < 300) {
        console.log(`[Basement API Success] ${method} ${url} - ${status} ${statusText}`, {
          data: response.data,
        });
      } else {
        console.warn(`[Basement API Warning] ${method} ${url} - ${status} ${statusText}`, {
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
        console.error(`[Basement API Timeout] ${method} ${url} - Request timeout after ${error.config.timeout}ms`);
      } else if (error.response) {
        console.error(`[Basement API Error] ${method} ${url} - ${status} ${statusText}`, {
          data: error.response.data,
          headers: error.response.headers,
        });
      } else if (error.request) {
        console.error(`[Basement API Network Error] ${method} ${url} - No response received`, error.request);
      } else {
        console.error(`[Basement API Error] ${method} ${url}`, error.message);
      }
    }

    if (error.response?.status === 401) {
      if (store) {
        store.dispatch('clearAuth');
      }
      BasementAuthController.logout();
      
      if (window.location.pathname !== '/auth/login') {
        window.location.href = '/auth/login';
      }
      return Promise.reject(error);
    }

    if (shouldRetry(error, config, config._retryCount || 0)) {
      if (store?.getters.token && store.getters.isTokenExpired) {
        store.dispatch('clearAuth');
        return Promise.reject(error);
      }
      
      config._retryCount = (config._retryCount || 0) + 1;
      const delay = RETRY_DELAY * config._retryCount;

      if (isDevelopment) {
        console.log(`[Basement API Retry] Retrying request (${config._retryCount}/${MAX_RETRIES}) after ${delay}ms`);
      }

      await sleep(delay);
      return basementApi(config);
    }
    
    return Promise.reject(error);
  }
);

export const createBasementCancelToken = () => {
  return axios.CancelToken.source();
};

export const isBasementCancelError = (error) => {
  return axios.isCancel(error);
};

export default basementApi;

