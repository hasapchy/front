import axios from "axios";
import { BasementAuthController } from "./BasementAuthController";
import store from "@/store";
import TokenUtils from "@/utils/tokenUtils";

const basementApi = axios.create({
  baseURL: `${import.meta.env.VITE_APP_BASE_URL}/api/basement`,
  headers: {
    "Content-Type": "application/json",
  },
});

basementApi.interceptors.request.use(
  async (config) => {
    const token = TokenUtils.getToken();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (store && store.getters.currentCompanyId) {
      config.headers['X-Company-ID'] = store.getters.currentCompanyId;
    } else {
      const defaultCompanyId = import.meta.env.VITE_BASEMENT_DEFAULT_COMPANY_ID || '1';
      config.headers['X-Company-ID'] = defaultCompanyId;
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
        const refreshToken = TokenUtils.getRefreshToken();
        
        if (refreshToken) {
          const response = await axios.post(`${import.meta.env.VITE_APP_BASE_URL}/api/user/refresh`, {}, {
            headers: { Authorization: `Bearer ${refreshToken}` }
          });
          
          if (response.data && response.data.access_token) {
            TokenUtils.setTokens({
              accessToken: response.data.access_token,
              refreshToken: response.data.refresh_token
            });
            
            error.config.headers.Authorization = `Bearer ${response.data.access_token}`;
            return axios(error.config);
          }
        }
      } catch (refreshError) {
        console.error("Ошибка при обновлении токена", refreshError);
        BasementAuthController.logout();
        
        if (window.location.pathname !== '/auth/login') {
          window.location.href = '/auth/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default basementApi;

