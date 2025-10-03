import { dayjsDate, dayjsDateTime } from "@/utils/dateUtils";

export default class TransactionDto {
  constructor(
    id,
    type,
    isTransfer,
    isSale,
    isReceipt,
    isDebt,
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
    this.isSale = isSale;
    this.isReceipt = isReceipt;
    this.isDebt = isDebt;
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
    let debtIcon = '';
    if (this.isDebt === 1 || this.isDebt === true) {
      debtIcon = ' <i class="fas fa-exclamation-triangle text-[#FFA500]" title="Долговая операция"></i>';
    }
    
    if (this.isTransfer === 1 || this.isTransfer === true) {
      return '<i class="fas fa-right-left text-[#337AB7] mr-2"></i> Трансфер' + debtIcon;
    } else {
      return this.type === 1
        ? '<i class="fas fa-circle-down text-[#5CB85C] mr-2"></i> Приход' + debtIcon
        : '<i class="fas fa-circle-up text-[#EE4F47] mr-2"></i> Расход' + debtIcon;
    }
  }

  sourceCell() {
    if (this.isSale === 1 || this.isSale === true) {
      return '<i class="fas fa-shopping-cart text-[#5CB85C] mr-2"></i> Продажа';
    } else if (this.isReceipt === 1 || this.isReceipt === true) {
      return '<i class="fas fa-box text-[#FFA500] mr-2"></i> Оприходование';
    } else {
      return '<i class="fas fa-circle text-[#6C757D] mr-2"></i> Прочее';
    }
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
