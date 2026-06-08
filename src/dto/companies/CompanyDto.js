import { createFromApiArray } from "@/utils/dtoUtils";
import { cloneWorkSchedule } from "@/constants/defaultWorkSchedule";
import { parseBindingsFromApi } from "@/constants/transactionCategoryBindings";
import { companyThemeFormFromApi } from "@/constants/companyThemePalette";

function requireInt(value, min, max, fieldName) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n)) {
    throw new Error(`Invalid company field "${fieldName}"`);
  }
  return Math.min(max, Math.max(min, n));
}

function requireBool(value, fieldName) {
  if (value === true || value === false) {
    return value;
  }
  if (typeof value === "number") {
    return value !== 0;
  }
  throw new Error(`Invalid company field "${fieldName}"`);
}

function requireDirection(value) {
  if (value === null || value === "") {
    return null;
  }
  return String(value);
}

function requireThreshold(value, fieldName) {
  if (value === null || value === "") {
    return null;
  }
  const n = Number(value);
  if (!Number.isFinite(n)) {
    throw new Error(`Invalid company field "${fieldName}"`);
  }
  return n;
}

function parseApiCompany(raw) {
  return {
    id: raw.id,
    name: raw.name,
    fullName: raw.full_name || "",
    address: raw.address || "",
    phone: raw.phone || "",
    email: raw.email || "",
    registrationNumber: raw.registration_number || "",
    warehouseNumber: raw.warehouse_number || "",
    workSchedule:
      raw.work_schedule != null ? cloneWorkSchedule(raw.work_schedule) : null,
    logo: raw.logo,
    showDeletedTransactions: requireBool(raw.show_deleted_transactions, "show_deleted_transactions"),
    displayDecimals: requireInt(raw.display_decimals, 0, 5, "display_decimals"),
    roundingEnabled: requireBool(raw.rounding_enabled, "rounding_enabled"),
    roundingDirection: requireDirection(raw.rounding_direction),
    roundingCustomThreshold: requireThreshold(raw.rounding_custom_threshold, "rounding_custom_threshold"),
    roundingOrdersEnabled: requireBool(raw.rounding_orders_enabled, "rounding_orders_enabled"),
    roundingOrdersDecimals: requireInt(raw.rounding_orders_decimals, 0, 2, "rounding_orders_decimals"),
    roundingContractsEnabled: requireBool(raw.rounding_contracts_enabled, "rounding_contracts_enabled"),
    roundingContractsDecimals: requireInt(raw.rounding_contracts_decimals, 0, 2, "rounding_contracts_decimals"),
    roundingWarehouseEnabled: requireBool(raw.rounding_warehouse_enabled, "rounding_warehouse_enabled"),
    roundingWarehouseDecimals: requireInt(raw.rounding_warehouse_decimals, 0, 2, "rounding_warehouse_decimals"),
    roundingTransactionsEnabled: requireBool(raw.rounding_transactions_enabled, "rounding_transactions_enabled"),
    roundingTransactionsDecimals: requireInt(raw.rounding_transactions_decimals, 0, 2, "rounding_transactions_decimals"),
    roundingQuantityDecimals: requireInt(
      raw.rounding_quantity_decimals,
      0,
      5,
      "rounding_quantity_decimals",
    ),
    roundingQuantityEnabled: requireBool(raw.rounding_quantity_enabled, "rounding_quantity_enabled"),
    roundingQuantityDirection: requireDirection(raw.rounding_quantity_direction),
    roundingQuantityCustomThreshold: requireThreshold(
      raw.rounding_quantity_custom_threshold,
      "rounding_quantity_custom_threshold",
    ),
    skipProjectOrderBalance: requireBool(raw.skip_project_order_balance, "skip_project_order_balance"),
    transactionCategoryBindings: parseBindingsFromApi(raw.transaction_category_bindings),
    uiTheme: companyThemeFormFromApi(raw.ui_theme),
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

export class CompanyDto {
  constructor(raw) {
    if (raw instanceof CompanyDto) {
      Object.assign(this, raw);
      return;
    }
    Object.assign(this, parseApiCompany(raw));
  }

  logoUrl() {
    if (this.logo?.length) {
      const timestamp = this.updatedAt
        ? new Date(this.updatedAt).getTime()
        : Date.now();
      return `${import.meta.env.VITE_APP_BASE_URL}/storage/${this.logo}?v=${timestamp}`;
    }
    return "/logo.png";
  }

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, (data) => new CompanyDto(data));
  }
}
