import axios from "axios";
import AuthController from "./AuthController";
import { startApiCall, endApiCall, getStore } from "@/store/storeManager";

// Создаем инстанс axios
const api = axios.create({
  baseURL: `${import.meta.env.VITE_APP_BASE_URL || 'http://192.168.0.119'}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    startApiCall();
    
    const token = localStorage.getItem("token");
    const tokenExpiresAt = localStorage.getItem("token_expires_at");
    
    if (token && tokenExpiresAt && Date.now() > parseInt(tokenExpiresAt)) {
      localStorage.removeItem("token");
      localStorage.removeItem("token_expires_at");
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Добавляем company_id в заголовок, если он есть в store
    const store = getStore();
    
    if (store && store.getters.currentCompanyId) {
      config.headers['X-Company-ID'] = store.getters.currentCompanyId;
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
        const refreshToken = localStorage.getItem("refresh_token");
        const refreshTokenExpiresAt = localStorage.getItem("refresh_token_expires_at");
        
        if (refreshToken && refreshTokenExpiresAt && Date.now() <= parseInt(refreshTokenExpiresAt)) {
          const { data } = await AuthController.refreshToken();
          if (data && data.access_token) {
            error.config.headers.Authorization = `Bearer ${data.access_token}`;
            return axios(error.config);
          }
        }
      } catch (refreshError) {
        console.error("Ошибка при обновлении токена", refreshError);
        localStorage.removeItem("token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("token_expires_at");
        localStorage.removeItem("refresh_token_expires_at");
        localStorage.removeItem("user");
        
        if (window.location.pathname !== '/auth/login') {
          window.location.href = '/auth/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
