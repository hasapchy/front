import { dayjsDate, dayjsDateTime } from "@/utils/dateUtils";
import ClientDto from "../client/ClientDto";

export default class TransactionDto {
  constructor(
    id,
    type,
    isTransfer,
    cashId,
    cashName,
    cashAmount,
    cashCurrencyId,
    cashCurrencyName,
    cashCurrencyCode,
    cashCurrencySymbol,
    origAmount,
    origCurrencyId,
    origCurrencyName,
    origCurrencyCode,
    origCurrencySymbol,
    userId,
    userName,
    categoryId,
    categoryName,
    categoryType,
    projectId,
    projectName,
    clientId,
    client = null,
    note = "",
    date = "",
    createdAt = "",
    updatedAt = "",
    orders = []
  ) {
    this.id = id;
    this.type = type;
    this.isTransfer = isTransfer;
    this.cashId = cashId;
    this.cashName = cashName;
    this.cashAmount = cashAmount;
    this.cashCurrencyId = cashCurrencyId;
    this.cashCurrencyName = cashCurrencyName;
    this.cashCurrencyCode = cashCurrencyCode;
    this.cashCurrencySymbol = cashCurrencySymbol;
    this.origAmount = origAmount;
    this.origCurrencyId = origCurrencyId;
    this.origCurrencyName = origCurrencyName;
    this.origCurrencyCode = origCurrencyCode;
    this.origCurrencySymbol = origCurrencySymbol;
    this.userId = userId;
    this.userName = userName;
    this.categoryId = categoryId;
    this.categoryName = categoryName;
    this.categoryType = categoryType;
    this.projectId = projectId;
    this.projectName = projectName;
    this.clientId = clientId;
    /** @type {ClientDto | null} */
    this.client = client;
    this.note = note;
    this.date = date;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.orders = orders;
  }

  typeName() {
    if (this.type == 1 || this.type == "1") {
      return "income";
    } else {
      return "outcome";
    }
  }

  typeCell() {
    return this.isTransfer === 1
      ? '<i class="fas fa-right-left text-[#337AB7] mr-2"></i> Трансфер'
      : this.type === 1
      ? '<i class="fas fa-circle-down text-[#5CB85C] mr-2"></i> Приход'
      : '<i class="fas fa-circle-up text-[#EE4F47] mr-2"></i> Расход';
  }

  cashAmountData() {
    var res = "<span";
    if (this.type === 1) {
      res += ' class="text-[#5CB85C] font-semibold"> +';
    } else {
      res += ' class="text-[#EE4F47] font-semibold"> -';
    }
    res += `${this.cashAmount} ${this.cashCurrencySymbol}</span>`;
    return res;
  }
  origAmountData() {
    return `${this.origAmount} ${this.origCurrencySymbol}`;
  }

  formatDate() {
    return dayjsDateTime(this.date);
  }

  formatCreatedAt() {
    return dayjsDate(this.createdAt);
  }

  formatUpdatedAt() {
    return dayjsDate(this.updatedAt);
  }
}
