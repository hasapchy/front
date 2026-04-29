import { STORE_CONFIG } from "./config";

const CLIENT_TYPE_FILTER_VALUES = STORE_CONFIG.clientTypeFilterValues;

export function normClientFilter(value) {
  if (!value || value === "all") {
    return [];
  }

  let rawValues;
  if (Array.isArray(value)) {
    rawValues = value;
  } else if (value?.split) {
    rawValues = value.split(",");
  } else {
    return [];
  }

  const normalized = rawValues
    .map((item) => String(item).trim())
    .filter((item) => CLIENT_TYPE_FILTER_VALUES.includes(item));

  return Array.from(new Set(normalized));
}

export function normCashFilter(value) {
  if (!value || value === "all") {
    return [];
  }

  let rawValues;
  if (Array.isArray(value)) {
    rawValues = value;
  } else if (value?.split) {
    rawValues = value.split(",");
  } else {
    return [];
  }

  const normalized = rawValues
    .map((item) => {
      const num = parseInt(String(item).trim(), 10);
      return isNaN(num) ? null : num;
    })
    .filter((item) => item !== null);

  return Array.from(new Set(normalized));
}

export function stableKey(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableKey(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableKey(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}
