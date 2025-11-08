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
    currency_code,
    currency_symbol,
    createdAt = "",
    updatedAt = ""
  ) {
    this.id = id;
    this.name = name;
    this.balance = balance;
    this.users = users;
    this.currencyId = currency_id;
    this.currencyName = currency_name;
    this.currencyCode = currency_code;
    this.currencySymbol = currency_symbol;
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
        data.currency?.code,
        data.currency?.symbol,
        data.created_at,
        data.updated_at
      );
    }).filter(Boolean);
  }
}
