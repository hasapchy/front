import { formatQuantity } from "./numberUtils";
import i18n from "@/i18n";

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

export function formatFieldValue(fieldName, value) {
  const t = i18n.global.t.bind(i18n.global);
  if (value === null || value === undefined || value === "") {
    return t("symbolEmDash");
  }

  if (fieldName === "quantity") {
    return formatQuantity(value);
  }

  if (
    fieldName === "total_price" ||
    fieldName === "price" ||
    fieldName === "discount" ||
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
