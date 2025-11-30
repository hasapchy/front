import axios from "axios";
import AuthController from "./AuthController";
import { startApiCall, endApiCall, getStore } from "@/store/storeManager";
import TokenUtils from "@/utils/tokenUtils";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_APP_BASE_URL || 'http://192.168.0.119'}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  async (config) => {
    startApiCall();
    
    const token = TokenUtils.getToken();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Добавляем company_id в заголовок, если он есть в store, иначе используем компанию по умолчанию
    const store = getStore();
    
    if (store && store.getters.currentCompanyId) {
      config.headers['X-Company-ID'] = store.getters.currentCompanyId;
    } else {
      const defaultCompanyId = import.meta.env.VITE_DEFAULT_COMPANY_ID || '1';
      config.headers['X-Company-ID'] = defaultCompanyId;
    }
    
    // ✅ Отключаем кэширование для основных API запросов (список, поиск, фильтры)
    // Браузер НЕ должен кэшировать данные которые зависят от параметров запроса
    if (config.method === 'get' || config.method === 'GET') {
      config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      config.headers['Pragma'] = 'no-cache';
      config.headers['Expires'] = '0';
    }
    
    return config;
  },
  (error) => {
    endApiCall();
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    endApiCall();
    return response;
  },
  async (error) => {
    endApiCall();
    
    if (error.response?.status === 401) {
      try {
        const refreshToken = TokenUtils.getRefreshToken();
        
        if (refreshToken) {
          const { data } = await AuthController.refreshToken();
          if (data && data.access_token) {
            error.config.headers.Authorization = `Bearer ${data.access_token}`;
            return axios(error.config);
          }
        }
      } catch (refreshError) {
        console.error("Ошибка при обновлении токена", refreshError);
        TokenUtils.clearAuthData();
        
        if (window.location.pathname !== '/auth/login') {
          window.location.href = '/auth/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
