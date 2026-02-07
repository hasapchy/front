import axios from "axios";
import AuthController from "./AuthController";
import { startApiCall, endApiCall, getStore } from "@/store/storeManager";
import TokenUtils from "@/utils/tokenUtils";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_APP_BASE_URL || "http://127.0.0.1"}/api`,
  timeout: 30000,
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

    const store = getStore();

    if (store && store.getters.currentCompanyId) {
      config.headers["X-Company-ID"] = store.getters.currentCompanyId;
    } else {
      const defaultCompanyId = import.meta.env.VITE_DEFAULT_COMPANY_ID || "1";
      config.headers["X-Company-ID"] = defaultCompanyId;
    }

    if (config.method === "get" || config.method === "GET") {
      config.headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
      config.headers["Pragma"] = "no-cache";
      config.headers["Expires"] = "0";
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

    if (error.code === "ECONNABORTED") {
      const store = getStore();
      if (store) {
        try {
          const i18n = (await import("@/i18n")).default;
          const t = i18n?.global?.t ?? ((key) => key);
          store.dispatch("showNotification", {
            title: t("error"),
            subtitle: t("loadTimeout"),
            isDanger: true,
          });
        } catch (_) {
          store.dispatch("showNotification", {
            title: "Error",
            subtitle: "Load timeout",
            isDanger: true,
          });
        }
      }
      return Promise.reject(error);
    }

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

        if (window.location.pathname !== "/auth/login") {
          window.location.href = "/auth/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
