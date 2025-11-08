import { createFromApiArray } from "@/utils/dtoUtils";

export default class CompanyRoundingRuleDto {
  constructor(data) {
    this.id = data.id;
    this.companyId = data.company_id;
    this.context = data.context;
    this.decimals = data.decimals;
    this.direction = data.direction;
    this.customThreshold = data.custom_threshold || null;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, (data) => new CompanyRoundingRuleDto(data));
  }

  static contexts = {
    orders: "orders",
    receipts: "receipts",
    sales: "sales",
    transactions: "transactions",
  };

  static directions = {
    standard: "standard",
    up: "up",
    down: "down",
    custom: "custom",
  };
}

