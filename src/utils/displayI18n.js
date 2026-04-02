import i18n from "@/i18n";

export function dt(key, params = {}) {
  return i18n.global.t(`display.${key}`, params);
}
