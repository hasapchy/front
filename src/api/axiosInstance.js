import axios from "axios";
import AuthController from "./AuthController";
import { startApiCall, endApiCall, getStore } from "@/store/storeManager";
import TokenUtils from "@/utils/tokenUtils";

const MAINTENANCE_BYPASS_KEY = "maintenance_bypass";

const baseURL = `${import.meta.env.VITE_APP_BASE_URL || "http://127.0.0.1"}/api`;

const api = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

export const authApi = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

export function getMaintenanceBypassKey() {
  return MAINTENANCE_BYPASS_KEY;
}

async function showSessionExpiredNotification() {
  const store = getStore();
  if (!store) {
    return;
  }

  try {
    const i18n = (await import("@/i18n")).default;
    const t = i18n?.global?.t ?? ((key) => key);
    store.dispatch("showNotification", {
      title: t("sessionExpiredTitle"),
      subtitle: t("sessionExpired"),
      isDanger: true,
    });
  } catch (_) {
    store.dispatch("showNotification", {
      title: "Сессия истекла",
      subtitle: "Время сессии истекло. Войдите снова.",
      isDanger: true,
    });
  }
}

api.interceptors.request.use(
  async (config) => {
    startApiCall();

    const bypass = localStorage.getItem(MAINTENANCE_BYPASS_KEY);
    if (bypass) {
      config.headers["X-Maintenance-Bypass"] = bypass;
    }

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

    if (error.response?.status === 503) {
      if (window.location.pathname !== "/maintenance") {
        window.location.href = "/maintenance";
      }
      return Promise.reject(error);
    }

    const requestUrl = error.config?.url || "";
    if (requestUrl.endsWith("/user/refresh")) {
      TokenUtils.clearAuthData();
      if (window.location.pathname !== "/auth/login") {
        await showSessionExpiredNotification();
        window.location.href = "/auth/login";
      }
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      const refreshToken = TokenUtils.getRefreshToken();
      if (refreshToken) {
        if (!api.refreshPromise) {
          api.refreshPromise = AuthController.refreshToken();
        }
        try {
          await api.refreshPromise;
          error.config.headers.Authorization = `Bearer ${TokenUtils.getToken()}`;
          return api(error.config);
        } catch (_) {
          TokenUtils.clearAuthData();
          if (window.location.pathname !== "/auth/login") {
            await showSessionExpiredNotification();
            window.location.href = "/auth/login?session_revoked=1";
          }
        } finally {
          api.refreshPromise = null;
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
