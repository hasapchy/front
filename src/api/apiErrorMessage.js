import i18n from "@/i18n";

export function apiErrorMessage(key, params = {}) {
  return i18n.global.t(`apiErrors.${key}`, params);
}

function flatApiErrorCodeToApiErrorsKey(code) {
  if (typeof code !== "string" || !/^[A-Z][A-Z0-9_]*$/.test(code)) {
    return null;
  }
  const parts = code.toLowerCase().split("_");
  if (parts.length < 2) {
    return null;
  }
  return parts[0] + parts.slice(1).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");
}

export function translateFlatApiErrorPayload(data) {
  if (!data || typeof data !== "object") {
    return null;
  }
  const raw = data.error ?? data.message;
  if (typeof raw !== "string") {
    return null;
  }
  const key = flatApiErrorCodeToApiErrorsKey(raw);
  if (!key) {
    return null;
  }
  const path = `apiErrors.${key}`;
  if (!i18n.global.te(path)) {
    return null;
  }
  return i18n.global.t(path);
}
