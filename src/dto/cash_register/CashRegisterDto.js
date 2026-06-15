import { dtoDateFormatters } from "@/utils/dateUtils";
import { getUserIdsFromArray, createFromApiArray } from "@/utils/dtoUtils";
import { getCashRegisterDisplayNameByParts, normalizeCashRegisterBoolean } from "@/utils/cashRegisterUtils";

export default class CashRegisterDto {
  constructor(
    id,
    name,
    balance,
    users = [],
    currency_id,
    currency_name,
    currency_code,
    is_cash,
    is_working_minus,
    participates_in_transfers,
    sort_order,
    icon,
    icon_size,
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
    this.currencyCode = currency_code;
    this.isCash = normalizeCashRegisterBoolean(is_cash);
    this.displayName = getCashRegisterDisplayNameByParts(this.name, this.isCash);
    this.isWorkingMinus = normalizeCashRegisterBoolean(is_working_minus);
    this.participatesInTransfers = normalizeCashRegisterBoolean(participates_in_transfers, true);
    this.sortOrder = Number.isFinite(Number(sort_order)) ? Number(sort_order) : 0;
    this.icon = icon ?? null;
    this.iconSize = ["small", "medium", "large"].includes(icon_size) ? icon_size : "medium";
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
        data.participates_in_transfers,
        data.sort_order,
        data.icon,
        data.icon_size,
        data.color,
        data.creator_id,
        data.creator,
        data.created_at,
        data.updated_at
      );
    }).filter(Boolean);
  }
}
