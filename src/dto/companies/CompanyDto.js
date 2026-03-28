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
  if (value === true || value === false) {
    return value;
  }
  const numericValue = Number(value);
  if (!Number.isNaN(numericValue)) {
    return numericValue !== 0;
  }
  const normalized = String(value).toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return fallback;
}

export class CompanyDto {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.workSchedule = data.work_schedule || this.getDefaultWorkSchedule();
    this.logo = data.logo;
    this.showDeletedTransactions = data.show_deleted_transactions || false;
    this.roundingDecimals = normalizeNumber(data.rounding_decimals);
    this.roundingEnabled = normalizeBoolean(data.rounding_enabled, true);
    this.roundingDirection = data.rounding_direction || "standard";
    this.roundingCustomThreshold = normalizeNumber(
      data.rounding_custom_threshold
    );
    this.roundingQuantityDecimals = normalizeNumber(
      data.rounding_quantity_decimals
    );
    this.roundingQuantityEnabled = normalizeBoolean(
      data.rounding_quantity_enabled,
      true
    );
    this.roundingQuantityDirection =
      data.rounding_quantity_direction || "standard";
    this.roundingQuantityCustomThreshold = normalizeNumber(
      data.rounding_quantity_custom_threshold
    );
    this.skipProjectOrderBalance =
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

  /**
   * Получить дефолтный рабочий график
   */
  getDefaultWorkSchedule() {
    return {
      1: { enabled: true, start: '09:00', end: '18:00' },
      2: { enabled: true, start: '09:00', end: '18:00' },
      3: { enabled: true, start: '09:00', end: '18:00' },
      4: { enabled: true, start: '09:00', end: '18:00' },
      5: { enabled: true, start: '09:00', end: '18:00' },
      6: { enabled: false, start: '10:00', end: '14:00' },
      7: { enabled: false, start: '00:00', end: '00:00' }
    };
  }
}
