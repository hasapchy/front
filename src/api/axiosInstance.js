import axios from "axios";
import AuthController from "./AuthController";
import { startApiCall, endApiCall, getStore } from "@/store/storeManager";

// Создаем инстанс axios
const api = axios.create({
  baseURL: `${import.meta.env.VITE_APP_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    startApiCall();
    
    const token = localStorage.getItem("token");
    const tokenExpiresAt = localStorage.getItem("tokenExpiresAt");
    
    if (token && tokenExpiresAt && Date.now() > parseInt(tokenExpiresAt)) {
      localStorage.removeItem("token");
      localStorage.removeItem("tokenExpiresAt");
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Добавляем company_id в заголовок, если он есть в store
    const store = getStore();
    if (store && store.getters.currentCompanyId) {
      config.headers['X-Company-ID'] = store.getters.currentCompanyId;
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
        const refreshToken = localStorage.getItem("refreshToken");
        const refreshTokenExpiresAt = localStorage.getItem("refreshTokenExpiresAt");
        
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
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("tokenExpiresAt");
        localStorage.removeItem("refreshTokenExpiresAt");
        localStorage.removeItem("userInfo");
        
        if (window.location.pathname !== '/auth/login') {
          window.location.href = '/auth/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
