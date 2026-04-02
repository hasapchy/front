import i18n from "@/i18n";

export function apiErrorMessage(key, params = {}) {
  return i18n.global.t(`apiErrors.${key}`, params);
}
