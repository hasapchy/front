import axios from "axios";
import AuthController from "./AuthController";
import { startApiCall, endApiCall } from "@/store/storeManager";

// Создаем инстанс axios
const api = axios.create({
  baseURL: `${import.meta.env.VITE_APP_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    // Увеличиваем счетчик активных API вызовов
    startApiCall();
    
    const token = localStorage.getItem("token");
    const tokenExpiresAt = localStorage.getItem("tokenExpiresAt");
    
    // Проверяем, не истек ли токен
    if (token && tokenExpiresAt && Date.now() > parseInt(tokenExpiresAt)) {
      // Токен истек, удаляем его
      localStorage.removeItem("token");
      localStorage.removeItem("tokenExpiresAt");
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // Уменьшаем счетчик при ошибке запроса
    endApiCall();
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    // Уменьшаем счетчик при успешном ответе
    endApiCall();
    return response;
  },
  async (error) => {
    // Уменьшаем счетчик при ошибке ответа
    endApiCall();
    
    if (error.response?.status === 401) {
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        const refreshTokenExpiresAt = localStorage.getItem("refreshTokenExpiresAt");
        
        // Проверяем, не истек ли refresh token
        if (refreshToken && refreshTokenExpiresAt && Date.now() <= parseInt(refreshTokenExpiresAt)) {
          const { data } = await AuthController.refreshToken();
          if (data && data.access_token) {
            // Обновляем заголовок и повторяем запрос
            error.config.headers.Authorization = `Bearer ${data.access_token}`;
            return axios(error.config);
          }
        }
      } catch (refreshError) {
        console.error("Ошибка при обновлении токена", refreshError);
        // Очищаем все данные аутентификации и перенаправляем на логин
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("tokenExpiresAt");
        localStorage.removeItem("refreshTokenExpiresAt");
        localStorage.removeItem("userInfo");
        
        // Перенаправляем на страницу логина
        if (window.location.pathname !== '/auth/login') {
          window.location.href = '/auth/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
