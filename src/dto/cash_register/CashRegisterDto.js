import { dtoDateFormatters } from "@/utils/dateUtils";
import { getUserIdsFromArray, createFromApiArray } from "@/utils/dtoUtils";
import { getCashRegisterDisplayNameByParts } from "@/utils/cashRegisterUtils";

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
    is_working_minus,
    icon,
    color,
    creator_id = null,
    creator = null,
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
    this.isCash = Number(is_cash) === 1;
    this.displayName = getCashRegisterDisplayNameByParts(this.name, this.isCash);
    this.isWorkingMinus = Number(is_working_minus) === 1;
    this.icon = icon ?? null;
    this.color = color ?? null;
    this.creatorId = creator_id;
    this.creator = creator ?? null;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  formatCreatedAt() {
    return dtoDateFormatters.formatCreatedAt(this.createdAt);
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
        data.users ?? [],
        data.currency_id,
        data.currency?.name,
        data.currency?.code,
        data.is_cash,
        data.is_working_minus,
        data.icon,
        data.color,
        data.creator_id,
        data.creator,
        data.created_at,
        data.updated_at
      );
    }).filter(Boolean);
  }
}
