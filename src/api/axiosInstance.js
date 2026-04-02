import axios from "axios";
import { API_BASE_URL, refreshSessionTokens } from "./authSession";
import { startApiCall, endApiCall, getStore } from "@/store/storeManager";
import TokenUtils from "@/utils/tokenUtils";
import { toSnakeCaseDeep } from "@/utils/caseTransform";
import i18n from "@/i18n";

export { authApi } from "./authSession";

export const MAINTENANCE_BYPASS_KEY = "maintenance_bypass";

const defaults = {
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
};

function applyCaseTransform(config) {
  if (config.skipCaseTransform) return;
  if (config.params && !(config.params instanceof URLSearchParams)) {
    config.params = toSnakeCaseDeep(config.params);
  }
  if (config.data && !(config.data instanceof FormData)) {
    config.data = toSnakeCaseDeep(config.data);
  }
}

const api = axios.create(defaults);

function notify(titleKey, subtitleKey) {
  const store = getStore();
  if (!store) return;
  store.dispatch("showNotification", {
    title: i18n.global.t(titleKey),
    subtitle: i18n.global.t(subtitleKey),
    isDanger: true,
  });
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
    config.headers["X-Company-ID"] =
      store?.getters?.currentCompanyId ??
      import.meta.env.VITE_DEFAULT_COMPANY_ID ??
      "1";
    if (String(config.method).toLowerCase() === "get") {
      config.headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
      config.headers.Pragma = "no-cache";
      config.headers.Expires = "0";
    }
    applyCaseTransform(config);
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
      notify("error", "loadTimeout");
      return Promise.reject(error);
    }

    if (error.response?.status === 503) {
      if (window.location.pathname !== "/maintenance") {
        window.location.href = "/maintenance";
      }
      return Promise.reject(error);
    }

    const url = error.config?.url ?? "";
    if (url.endsWith("/user/refresh")) {
      TokenUtils.clearAuthData();
      if (window.location.pathname !== "/auth/login") {
        notify("sessionExpiredTitle", "sessionExpired");
        window.location.href = "/auth/login";
      }
      return Promise.reject(error);
    }

    // if (error.response?.status === 401 && TokenUtils.getRefreshToken()) {
    //   if (!api.refreshPromise) {
    //     api.refreshPromise = refreshSessionTokens();
    //   }
    //   try {
    //     await api.refreshPromise;
    //     error.config.headers.Authorization = `Bearer ${TokenUtils.getToken()}`;
    //     return api(error.config);
    //   } catch {
    //     TokenUtils.clearAuthData();
    //     if (window.location.pathname !== "/auth/login") {
    //       notify("sessionExpiredTitle", "sessionExpired");
    //       window.location.href = "/auth/login?session_revoked=1";
    //     }
    //   } finally {
    //     api.refreshPromise = null;
    //   }
    // }

    //start

    if (error.response?.status === 401 && !TokenUtils.getRefreshToken()) {
      TokenUtils.clearAuthData();
      if (window.location.pathname !== "/auth/login") {
        window.location.href = "/auth/login";
      }
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && TokenUtils.getRefreshToken()) {
      if (!api.refreshPromise) {
        api.refreshPromise = refreshSessionTokens();
      }
      try {
        await api.refreshPromise;
        error.config.headers.Authorization = `Bearer ${TokenUtils.getToken()}`;
        return api(error.config);
      } catch {
        TokenUtils.clearAuthData();
        if (window.location.pathname !== "/auth/login") {
          notify("sessionExpiredTitle", "sessionExpired");
          window.location.href = "/auth/login?session_revoked=1";
        }
      } finally {
        api.refreshPromise = null;
      }
    }
    //end

    return Promise.reject(error);
  }
);

export default api;
