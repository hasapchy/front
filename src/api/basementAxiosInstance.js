import axios from "axios";
import { BasementAuthController } from "./BasementAuthController";
import store from "@/store";

// Создаем инстанс axios для basement
const basementApi = axios.create({
  baseURL: `${import.meta.env.VITE_APP_BASE_URL}/api/basement`,
  headers: {
    "Content-Type": "application/json",
  },
});

basementApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    const tokenExpiresAt = localStorage.getItem("token_expires_at");
    
    
    // Проверяем, не истек ли токен
    if (token && tokenExpiresAt && Date.now() > parseInt(tokenExpiresAt)) {
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("token_expires_at");
      localStorage.removeItem("refresh_token_expires_at");
      localStorage.removeItem("user");
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Добавляем company_id в заголовок, если он есть в store, иначе используем компанию по умолчанию
    if (store && store.getters.currentCompanyId) {
      config.headers['X-Company-ID'] = store.getters.currentCompanyId;
    } else {
      // Для basement системы используем компанию по умолчанию (ID = 1)
      config.headers['X-Company-ID'] = '1';
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

basementApi.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      try {
        const refreshToken = localStorage.getItem("refresh_token");
        const refreshTokenExpiresAt = localStorage.getItem("refresh_token_expires_at");
        
        if (refreshToken && refreshTokenExpiresAt && Date.now() <= parseInt(refreshTokenExpiresAt)) {
          // Попытка обновить токен
          const response = await axios.post(`${import.meta.env.VITE_APP_BASE_URL}/api/user/refresh`, {}, {
            headers: { Authorization: `Bearer ${refreshToken}` }
          });
          
          if (response.data && response.data.access_token) {
            localStorage.setItem("token", response.data.access_token);
            localStorage.setItem("refresh_token", response.data.refresh_token);
            
            if (response.data.expires_in) {
              localStorage.setItem("token_expires_at", (Date.now() + response.data.expires_in * 1000).toString());
            }
            if (response.data.refresh_expires_in) {
              localStorage.setItem("refresh_token_expires_at", (Date.now() + response.data.refresh_expires_in * 1000).toString());
            }
            
            error.config.headers.Authorization = `Bearer ${response.data.access_token}`;
            return axios(error.config);
          }
        }
      } catch (refreshError) {
        console.error("Ошибка при обновлении токена", refreshError);
        BasementAuthController.logout();
        
        if (window.location.pathname !== '/basement/login') {
          window.location.href = '/basement/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default basementApi;

