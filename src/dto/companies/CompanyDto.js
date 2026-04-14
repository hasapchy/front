import { createFromApiArray } from "@/utils/dtoUtils";
import { COMPANY_ROUNDING_DEFAULTS } from "@/constants/companyRoundingDefaults";

function takeDefined(data, key) {
  if (Object.prototype.hasOwnProperty.call(data, key)) {
    return data[key];
  }
  return undefined;
}

function clampInt(value, min, max) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n)) {
    return null;
  }
  return Math.min(max, Math.max(min, n));
}

function toBool(value) {
  if (value === true || value === false) {
    return value;
  }
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "number") {
    return value !== 0;
  }
  const s = String(value).toLowerCase();
  if (s === "true" || s === "1") {
    return true;
  }
  if (s === "false" || s === "0") {
    return false;
  }
  return Boolean(value);
}

function optionalNumber(value) {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function isWorkScheduleFromApi(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  for (let d = 1; d <= 7; d++) {
    const day = value[d];
    if (!day || typeof day !== "object" || Array.isArray(day)) {
      return false;
    }
    if (typeof day.enabled !== "boolean") {
      return false;
    }
    if (typeof day.start !== "string" || typeof day.end !== "string") {
      return false;
    }
  }
  return true;
}

export class CompanyDto {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.workSchedule = isWorkScheduleFromApi(data.work_schedule)
      ? data.work_schedule
      : this.getDefaultWorkSchedule();
    this.logo = data.logo;
    this.showDeletedTransactions = data.show_deleted_transactions || false;

    const rd = takeDefined(data, "rounding_decimals");
    const rdClamped = clampInt(rd, 0, 2);
    this.roundingDecimals =
      rdClamped !== null
        ? rdClamped
        : COMPANY_ROUNDING_DEFAULTS.roundingDecimals;

    const re = takeDefined(data, "rounding_enabled");
    this.roundingEnabled =
      re === undefined || re === null
        ? COMPANY_ROUNDING_DEFAULTS.roundingEnabled
        : toBool(re);

    const rdir = takeDefined(data, "rounding_direction");
    if (rdir === undefined) {
      this.roundingDirection = COMPANY_ROUNDING_DEFAULTS.roundingDirection;
    } else if (rdir === null || rdir === "") {
      this.roundingDirection = null;
    } else {
      this.roundingDirection = String(rdir);
    }

    this.roundingCustomThreshold = optionalNumber(
      takeDefined(data, "rounding_custom_threshold")
    );

    const rqd = takeDefined(data, "rounding_quantity_decimals");
    const rqdClamped = clampInt(rqd, 0, 5);
    this.roundingQuantityDecimals =
      rqdClamped !== null
        ? rqdClamped
        : COMPANY_ROUNDING_DEFAULTS.roundingQuantityDecimals;

    const rqe = takeDefined(data, "rounding_quantity_enabled");
    this.roundingQuantityEnabled =
      rqe === undefined || rqe === null
        ? COMPANY_ROUNDING_DEFAULTS.roundingQuantityEnabled
        : toBool(rqe);

    const rqdir = takeDefined(data, "rounding_quantity_direction");
    if (rqdir === undefined) {
      this.roundingQuantityDirection =
        COMPANY_ROUNDING_DEFAULTS.roundingQuantityDirection;
    } else if (rqdir === null || rqdir === "") {
      this.roundingQuantityDirection = null;
    } else {
      this.roundingQuantityDirection = String(rqdir);
    }

    this.roundingQuantityCustomThreshold = optionalNumber(
      takeDefined(data, "rounding_quantity_custom_threshold")
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

  getDefaultWorkSchedule() {
    return {
      1: { enabled: true, start: "09:00", end: "18:00" },
      2: { enabled: true, start: "09:00", end: "18:00" },
      3: { enabled: true, start: "09:00", end: "18:00" },
      4: { enabled: true, start: "09:00", end: "18:00" },
      5: { enabled: true, start: "09:00", end: "18:00" },
      6: { enabled: false, start: "10:00", end: "14:00" },
      7: { enabled: false, start: "00:00", end: "00:00" },
    };
  }
}
