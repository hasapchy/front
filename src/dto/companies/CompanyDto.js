import { createFromApiArray } from "@/utils/dtoUtils";

function normalizeNumber(value) {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }
  const num = Number(value);
  return Number.isNaN(num) ? undefined : num;
}

function normalizeBoolean(value, fallback = true) {
  if (value === null || value === undefined) {
    return fallback;
  }
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value !== 0;
  }
  if (typeof value === "string") {
    if (value === "0") return false;
    if (value === "1") return true;
    return value.toLowerCase() === "true";
  }
  return fallback;
}

export class CompanyDto {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.logo = data.logo;
    this.show_deleted_transactions = data.show_deleted_transactions || false;
    this.rounding_decimals = normalizeNumber(data.rounding_decimals);
    this.rounding_enabled = normalizeBoolean(data.rounding_enabled, true);
    this.rounding_direction = data.rounding_direction || "standard";
    this.rounding_custom_threshold = normalizeNumber(
      data.rounding_custom_threshold
    );
    this.rounding_quantity_decimals = normalizeNumber(
      data.rounding_quantity_decimals
    );
    this.rounding_quantity_enabled = normalizeBoolean(
      data.rounding_quantity_enabled,
      true
    );
    this.rounding_quantity_direction =
      data.rounding_quantity_direction || "standard";
    this.rounding_quantity_custom_threshold = normalizeNumber(
      data.rounding_quantity_custom_threshold
    );
    this.skip_project_order_balance =
      data.skip_project_order_balance != null
        ? data.skip_project_order_balance == 1
        : true;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
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
