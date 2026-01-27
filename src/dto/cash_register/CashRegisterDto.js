import { dtoDateFormatters } from "@/utils/dateUtils";
import { getUserIdsFromArray, createFromApiArray } from "@/utils/dtoUtils";

export default class CashRegisterDto {
  constructor(
    id,
    name,
    balance,
    users = [],
    currency_id,
    currency_name,
    currency_symbol,
    is_cash,
    icon,
    createdAt = "",
    updatedAt = ""
  ) {
    this.id = id;
    this.name = name;
    this.balance = balance;
    this.users = users;
    this.currencyId = currency_id;
    this.currencyName = currency_name;
    this.currencySymbol = currency_symbol;
    this.isCash = Boolean(is_cash);
    this.icon = icon || null;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  formatCreatedAt() {
    return dtoDateFormatters.formatCreatedAt(this.createdAt);
  }

  formatUpdatedAt() {
    return dtoDateFormatters.formatUpdatedAt(this.updatedAt);
  }

  getUserIds() {
    return getUserIdsFromArray(this.users);
  }

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, data => {
      return new CashRegisterDto(
        data.id,
        data.name,
        data.balance,
        data.users || [],
        data.currency_id,
        data.currency?.name,
        data.currency?.symbol,
        data.is_cash,
        data.icon,
        data.created_at,
        data.updated_at
      );
    }).filter(Boolean);
  }
}
