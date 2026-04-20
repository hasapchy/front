import axios from "axios";
import { getStore } from "@/store/storeManager";
import TokenUtils from "@/utils/tokenUtils";
import { toSnakeCaseDeep } from "@/utils/caseTransform";
import i18n from "@/i18n";

const useDevProxy = import.meta.env.DEV;

export const APP_ORIGIN_URL = useDevProxy
  ? ""
  : (import.meta.env.VITE_APP_BASE_URL || "http://127.0.0.1").replace(/\/$/, "");

export const API_BASE_URL = useDevProxy ? "/api" : `${APP_ORIGIN_URL}/api`;

export const MAINTENANCE_BYPASS_KEY = "maintenance_bypass";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-CSRF-TOKEN",
});

function applyCaseTransform(config) {
  if (config.skipCaseTransform) {
    return;
  }
  if (config.params && !(config.params instanceof URLSearchParams)) {
    config.params = toSnakeCaseDeep(config.params);
  }
  if (config.data && !(config.data instanceof FormData)) {
    config.data = toSnakeCaseDeep(config.data);
  }
}

function readXsrfCookie() {
  if (typeof document === "undefined") {
    return null;
  }
  const parts = `; ${document.cookie}`.split(`; XSRF-TOKEN=`);
  if (parts.length < 2) {
    return null;
  }
  return parts.pop().split(";").shift() ?? null;
}

function applyXsrfHeader(config) {
  if (String(config.method).toLowerCase() === "get") {
    return;
  }
  const raw = readXsrfCookie();
  if (!raw) {
    return;
  }
  try {
    config.headers["X-CSRF-TOKEN"] = decodeURIComponent(raw);
  } catch {
    config.headers["X-CSRF-TOKEN"] = raw;
  }
}

export async function fetchSanctumCsrfCookie() {
  if (typeof window === "undefined") {
    return;
  }
  const origin = API_BASE_URL.startsWith("/")
    ? window.location.origin.replace(/\/$/, "")
    : APP_ORIGIN_URL.replace(/\/$/, "");
  if (!origin) {
    return;
  }
  delete api.defaults.headers.common["X-CSRF-TOKEN"];
  const res = await fetch(`${origin}/sanctum/csrf-cookie`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    headers: {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  });
  if (!res.ok) {
    throw new Error(`sanctum/csrf-cookie ${res.status}`);
  }
  const raw = readXsrfCookie();
  if (!raw) {
    throw new Error("XSRF-TOKEN cookie missing after sanctum/csrf-cookie");
  }
  try {
    api.defaults.headers.common["X-CSRF-TOKEN"] = decodeURIComponent(raw);
  } catch {
    api.defaults.headers.common["X-CSRF-TOKEN"] = raw;
  }
}

function notify(titleKey, subtitleKey) {
  const store = getStore();
  if (!store) {
    return;
  }
  store.dispatch("showNotification", {
    title: i18n.global.t(titleKey),
    subtitle: i18n.global.t(subtitleKey),
    isDanger: true,
  });
}

api.interceptors.request.use(
  (config) => {
    const bypass = localStorage.getItem(MAINTENANCE_BYPASS_KEY);
    if (bypass) {
      config.headers["X-Maintenance-Bypass"] = bypass;
    }
    applyXsrfHeader(config);
    applyCaseTransform(config);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const status = error.response?.status;
    const path = window.location.pathname;
    const onAuthRoute = path.startsWith("/auth/");
    const reqUrl = String(error.config?.url || "");

    if (error.code === "ECONNABORTED") {
      notify("error", "loadTimeout");
      return Promise.reject(error);
    }

    if (status === 503 && path !== "/maintenance") {
      window.location.href = "/maintenance";
      return Promise.reject(error);
    }

    if (status === 401 || status === 419) {
      const isBroadcastingAuth =
        reqUrl.includes("/broadcasting/auth") ||
        reqUrl.endsWith("broadcasting/auth");
      if (!isBroadcastingAuth) {
        TokenUtils.clearAuthData();
        if (!onAuthRoute) {
          window.location.href = "/auth/login";
        }
      }
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;
