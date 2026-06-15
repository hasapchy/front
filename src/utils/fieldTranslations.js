import { formatQuantity } from "./numberUtils";
import i18n from "@/i18n";

const CLIENT_TYPE_KEYS = new Set(["individual", "company", "employee", "investor"]);
const DISCOUNT_TYPE_KEYS = new Set(["fixed", "percent"]);
const BOOLEAN_FIELD_KEYS = new Set([
  "is_supplier",
  "is_conflict",
  "status",
  "returned",
  "stock_alert_notify",
]);

function localeTag() {
  const loc = i18n.global.locale;
  return typeof loc === "string" ? loc : loc.value;
}

function intlLocale() {
  return localeTag() === "en" ? "en-US" : "ru-RU";
}

export function translateField(fieldName) {
  const key = `timelineField.${fieldName}`;
  if (i18n.global.te(key)) {
    return i18n.global.t(key);
  }
  return fieldName;
}

/**
 * @param {string} fieldName
 * @returns {boolean}
 */
export function isTimelineHiddenField(fieldName) {
  const key = String(fieldName || "");
  return key.startsWith("def_") || key.startsWith("rep_") || key.startsWith("orig_");
}

/**
 * @param {unknown} value
 * @param {boolean} [allowNumeric]
 * @returns {boolean|null}
 */
export function parseBooleanLike(value, allowNumeric = false) {
  if (typeof value === "boolean") {
    return value;
  }
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "true") {
    return true;
  }
  if (normalized === "false") {
    return false;
  }
  if (allowNumeric) {
    if (value === 1 || value === "1") {
      return true;
    }
    if (value === 0 || value === "0") {
      return false;
    }
  }
  return null;
}

/**
 * @param {string} fieldName
 * @param {unknown} value
 * @param {{ entityType?: string }} [context]
 * @returns {string|number|null|undefined}
 */
export function formatTimelineFieldValue(fieldName, value, context = {}) {
  const t = i18n.global.t.bind(i18n.global);
  const te = (key) => i18n.global.te(key);
  const entityType = context.entityType || "";

  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (fieldName === "client_type") {
    const raw = String(value).trim();
    if (CLIENT_TYPE_KEYS.has(raw) || te(raw)) {
      return te(raw) ? t(raw) : raw;
    }
  }

  if (fieldName === "discount_type") {
    const raw = String(value).trim();
    if (DISCOUNT_TYPE_KEYS.has(raw) || te(raw)) {
      return te(raw) ? t(raw) : raw;
    }
  }

  if (fieldName === "type" && entityType === "product") {
    if (value === 1 || value === "1" || value === true) {
      return t("product");
    }
    if (value === 0 || value === "0" || value === false) {
      return t("service");
    }
  }

  const isBooleanField = BOOLEAN_FIELD_KEYS.has(fieldName)
    || (fieldName === "status" && entityType === "client");
  if (isBooleanField) {
    const bool = parseBooleanLike(value, true);
    if (bool !== null) {
      if (fieldName === "status" && entityType === "client") {
        return bool ? t("active") : t("inactive");
      }
      return bool ? t("yes") : t("no");
    }
  }

  return undefined;
}

export function formatFieldValue(fieldName, value) {
  const t = i18n.global.t.bind(i18n.global);
  if (value === null || value === undefined || value === "") {
    return t("symbolEmDash");
  }

  if (fieldName === "quantity") {
    return formatQuantity(value);
  }

  if (
    fieldName === "def_total_price" ||
    fieldName === "def_price" ||
    fieldName === "def_discount" ||
    fieldName === "total_price" ||
    fieldName === "price" ||
    fieldName === "discount" ||
    fieldName === "orig_price" ||
    fieldName === "orig_discount" ||
    fieldName === "orig_total_price" ||
    fieldName === "rep_price" ||
    fieldName === "rep_discount" ||
    fieldName === "rep_total_price" ||
    fieldName === "amount" ||
    fieldName === "orig_amount"
  ) {
    return new Intl.NumberFormat(intlLocale(), {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  if (fieldName === "date") {
    return new Date(value).toLocaleDateString(intlLocale());
  }

  if (fieldName === "type") {
    return value === 1 ? t("expense") : t("income");
  }

  if (fieldName.endsWith("_id")) {
    return value;
  }

  return value;
}
