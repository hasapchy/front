import { STORE_CONFIG } from "@/store/config";

export function normalizeUiTheme(value) {
  return value === "dark" ? "dark" : "light";
}

export function applyUiThemeClass(theme) {
  const isDark = normalizeUiTheme(theme) === "dark";
  document.documentElement.classList.toggle("dark", isDark);
}

export function readUiThemeFromLocalStorageKey(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    const t = parsed?.uiTheme;
    if (t === "dark" || t === "light") {
      return t;
    }
  } catch {
    return null;
  }
  return null;
}

export function initUiThemeSync(store) {
  applyUiThemeClass(store.state.uiTheme);
  store.subscribe((mutation) => {
    if (mutation.type === "SET_UI_THEME") {
      applyUiThemeClass(mutation.payload);
    }
  });
}

export function readPersistedUiThemeEarly() {
  return readUiThemeFromLocalStorageKey(STORE_CONFIG.localStorageKeys.userSettings);
}
