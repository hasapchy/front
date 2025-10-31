export default class CompanyRoundingRuleDto {
  constructor(data) {
    this.id = data.id;
    this.company_id = data.company_id;
    this.context = data.context; // orders, receipts, sales, transactions
    this.decimals = data.decimals; // 2-5
    this.direction = data.direction; // standard, up, down, custom
    this.custom_threshold = data.custom_threshold || null; // 0.0-1.0, только для custom
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  static fromArray(rules) {
    if (!rules || !Array.isArray(rules)) {
      return [];
    }
    return rules.map((rule) => new CompanyRoundingRuleDto(rule));
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

