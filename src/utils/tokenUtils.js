import { STORE_CONFIG } from "@/store/config";

const AUTH_USER_KEY = STORE_CONFIG.localStorageKeys.authUser;

const LEGACY_KEYS = [
  "token",
  "refresh_token",
  "user",
  "hasap_access_token",
  "hasap_refresh_token",
];

function removeLegacyKeys() {
  LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));
}

export const TokenUtils = {
  setAuthUser(user) {
    removeLegacyKeys();
    if (user) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_USER_KEY);
    }
    localStorage.removeItem("user");
  },

  clearAuthData() {
    removeLegacyKeys();
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem("user");
  },
};

export default TokenUtils;
