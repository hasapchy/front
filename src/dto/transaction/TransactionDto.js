import { dayjsDate, dayjsDateTime } from "@/utils/dateUtils";
import { formatCurrency } from "@/utils/numberUtils";

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
    orders = [],
    sourceType = null,
    sourceId = null,
    isDeleted = false
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
    this.sourceType = sourceType;
    this.sourceId = sourceId;
    this.isDeleted = isDeleted;
  }

  typeName() {
    if (this.type == 1 || this.type == "1") {
      return "income";
    } else {
      return "outcome";
    }
  }

  typeCell() {
    if (this.isTransfer === 1 || this.isTransfer === true) {
      return '<i class="fas fa-right-left text-[#337AB7] mr-2"></i> Трансфер';
    } else {
      return this.type === 1
        ? '<i class="fas fa-circle-down text-[#5CB85C] mr-2"></i> Приход'
        : '<i class="fas fa-circle-up text-[#EE4F47] mr-2"></i> Расход';
    }
  }

  sourceCell() {
    // Если есть связь, делаем кликабельным
    if (this.sourceType && this.sourceId) {
      let icon = '';
      let text = '';
      
      if (this.sourceType.includes('Sale')) {
        icon = 'fa-shopping-cart';
        text = 'Продажа';
      } else if (this.sourceType.includes('Order')) {
        icon = 'fa-file-invoice';
        text = 'Заказ';
      } else if (this.sourceType.includes('WhReceipt')) {
        icon = 'fa-box';
        text = 'Оприходование';
      } else {
        icon = 'fa-link';
        text = 'Связь';
      }
      
      return `<i class="fas ${icon} text-[#337AB7] mr-2 cursor-pointer hover:text-[#23527c]" data-source-type="${this.sourceType}" data-source-id="${this.sourceId}" title="Открыть ${text} #${this.sourceId}"></i> ${text}`;
    }
    
    // Если нет связи, обычное отображение
    if (this.isSale === 1 || this.isSale === true) {
      return '<i class="fas fa-shopping-cart text-[#5CB85C] mr-2"></i> Продажа';
    } else if (this.isReceipt === 1 || this.isReceipt === true) {
      return '<i class="fas fa-box text-[#FFA500] mr-2"></i> Оприходование';
    } else {
      return '<i class="fas fa-circle text-[#6C757D] mr-2"></i> Транзакция';
    }
  }

  debtCell() {
    if (this.isDebt === 1 || this.isDebt === true || this.isDebt === '1') {
      return '<i class="fas fa-check text-green-500"></i>';
    } else {
      return '<i class="fas fa-times text-red-500"></i>';
    }
  }

  cashAmountData() {
    var res = "<span";
    if (this.type === 1) {
      res += ' class="text-[#5CB85C] font-semibold"> +';
    } else {
      res += ' class="text-[#EE4F47] font-semibold"> -';
    }
    // formatCurrency автоматически использует decimals из настроек компании
    res += `${formatCurrency(this.cashAmount, this.cashCurrencySymbol, null, true)}</span>`;
    return res;
  }
  origAmountData() {
    // formatCurrency автоматически использует decimals из настроек компании
    return formatCurrency(this.origAmount, this.origCurrencySymbol, null, true);
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
