import axios from "axios";
import TokenUtils from "@/utils/tokenUtils";
import { toSnakeCaseDeep } from "@/utils/caseTransform";
import { getDeviceFingerprint } from "@/utils/fingerprint";

export const API_BASE_URL = `${import.meta.env.VITE_APP_BASE_URL || "http://127.0.0.1"}/api`;

export const authApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

authApi.interceptors.request.use((config) => {
  if (config.skipCaseTransform) return config;
  if (config.params && !(config.params instanceof URLSearchParams)) {
    config.params = toSnakeCaseDeep(config.params);
  }
  if (config.data && !(config.data instanceof FormData)) {
    config.data = toSnakeCaseDeep(config.data);
  }
  return config;
});

export async function refreshSessionTokens() {
  const { data } = await authApi.post("/user/refresh", {
    refreshToken: TokenUtils.getRefreshToken(),
    deviceFingerprint: await getDeviceFingerprint(),
  });
  const p = data.data;
  TokenUtils.setTokens({
    accessToken: p.access_token,
    refreshToken: p.refresh_token,
  });
  if (p.user) {
    localStorage.setItem("user", JSON.stringify(p.user));
  }
  return p;
}
