import axios from "axios";
import AuthController from "./AuthController";

// Создаем инстанс axios
const api = axios.create({
  baseURL: `${import.meta.env.VITE_APP_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.log("401 error");

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) {
          const { data } = await AuthController.refreshToken();
          if (data) {
            localStorage.setItem("token", data.access_token);
            error.config.headers.Authorization = `Bearer ${data.access_token}`;
            return axios(error.config);
          }
        }
      } catch (refreshError) {
        console.error("Ошибка при обновлении токена", refreshError);
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        window.location.reload();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
