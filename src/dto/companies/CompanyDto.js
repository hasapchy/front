import { createFromApiArray } from "@/utils/dtoUtils";

export class CompanyDto {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.logo = data.logo;
    this.show_deleted_transactions = data.show_deleted_transactions || false;
    this.rounding_decimals = data.rounding_decimals;
    this.rounding_enabled = data.rounding_enabled ?? true;
    this.rounding_direction = data.rounding_direction || 'standard';
    this.rounding_custom_threshold = data.rounding_custom_threshold;
    this.rounding_quantity_decimals = data.rounding_quantity_decimals;
    this.rounding_quantity_enabled = data.rounding_quantity_enabled ?? true;
    this.rounding_quantity_direction = data.rounding_quantity_direction || 'standard';
    this.rounding_quantity_custom_threshold = data.rounding_quantity_custom_threshold;
    this.skip_project_order_balance = data.skip_project_order_balance != null ? (data.skip_project_order_balance == 1) : true;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  logoUrl() {
    if (this.logo?.length) {
      const timestamp = this.updatedAt ? new Date(this.updatedAt).getTime() : Date.now();
      return `${import.meta.env.VITE_APP_BASE_URL}/storage/${this.logo}?v=${timestamp}`;
    }
    return '/logo.png';
  }

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, (data) => new CompanyDto(data));
  }
}
