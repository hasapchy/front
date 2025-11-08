import { dtoDateFormatters } from "@/utils/dateUtils";
import { formatCurrencyWithRounding } from "@/utils/numberUtils";
import { formatAmountWithColor, createFromApiArray } from "@/utils/dtoUtils";
import ClientDto from "@/dto/client/ClientDto";

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
    return this.type == 1 ? "income" : "outcome";
  }

  typeCell() {
    if (this.isTransfer == 1) {
      return '<i class="fas fa-right-left text-[#337AB7] mr-2"></i> Трансфер';
    }
    return this.type == 1
      ? '<i class="fas fa-circle-down text-[#5CB85C] mr-2"></i> Приход'
      : '<i class="fas fa-circle-up text-[#EE4F47] mr-2"></i> Расход';
  }

  sourceCell() {
    if (this.sourceType && this.sourceId) {
      const sourceMap = {
        'Sale': { icon: 'fa-shopping-cart', text: 'Продажа' },
        'Order': { icon: 'fa-file-invoice', text: 'Заказ' },
        'WhReceipt': { icon: 'fa-box', text: 'Оприходование' }
      };
      
      const source = Object.entries(sourceMap).find(([key]) => this.sourceType.includes(key))?.[1] || { icon: 'fa-link', text: 'Связь' };
      return `<i class="fas ${source.icon} text-[#337AB7] mr-2 cursor-pointer hover:text-[#23527c]" data-source-type="${this.sourceType}" data-source-id="${this.sourceId}" title="Открыть ${source.text} #${this.sourceId}"></i> ${source.text}`;
    }
    
    if (this.isSale == 1) {
      return '<i class="fas fa-shopping-cart text-[#5CB85C] mr-2"></i> Продажа';
    }
    if (this.isReceipt == 1) {
      return '<i class="fas fa-box text-[#FFA500] mr-2"></i> Оприходование';
    }
    return '<i class="fas fa-circle text-[#6C757D] mr-2"></i> Транзакция';
  }

  debtCell() {
    return this.isDebt == 1
      ? '<i class="fas fa-check text-green-500"></i>'
      : '<i class="fas fa-times text-red-500"></i>';
  }

  cashAmountData() {
    const isPositive = this.type == 1;
    return formatAmountWithColor(this.cashAmount * (isPositive ? 1 : -1), {
      positiveColor: "text-[#5CB85C]",
      negativeColor: "text-[#EE4F47]",
      showSign: true,
      formatFn: (val) => formatCurrencyWithRounding(Math.abs(val), this.cashCurrencySymbol, true),
      className: "font-semibold"
    });
  }
  origAmountData() {
    return formatCurrencyWithRounding(this.origAmount, this.origCurrencySymbol, true);
  }

  formatDate() {
    return dtoDateFormatters.formatDate(this.date);
  }

  formatCreatedAt() {
    return dtoDateFormatters.formatCreatedAt(this.createdAt);
  }

  formatUpdatedAt() {
    return dtoDateFormatters.formatUpdatedAt(this.updatedAt);
  }

  clone() {
    return new TransactionDto(
      null,
      this.type,
      this.isTransfer,
      this.isSale,
      this.isReceipt,
      this.isDebt,
      this.cashId,
      this.cashName,
      this.cashAmount,
      this.cashCurrencyId,
      this.cashCurrencyName,
      this.cashCurrencyCode,
      this.cashCurrencySymbol,
      this.origAmount,
      this.origCurrencyId,
      this.origCurrencyName,
      this.origCurrencyCode,
      this.origCurrencySymbol,
      this.userId,
      this.userName,
      this.categoryId,
      this.categoryName,
      this.categoryType,
      this.projectId,
      this.projectName,
      this.clientId,
      this.client,
      this.note,
      this.date,
      this.createdAt,
      this.updatedAt,
      this.orders,
      this.sourceType ?? null,
      this.sourceId ?? null,
      false
    );
  }

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, data => {
      const client = data.client ? ClientDto.fromApiArray([data.client])[0] || null : null;
      
      return new TransactionDto(
        data.id,
        data.type,
        data.is_transfer,
        data.is_sale || 0,
        data.is_receipt || 0,
        data.is_debt || 0,
        data.cash_id,
        data.cash_name,
        data.cash_amount,
        data.cash_currency_id,
        data.cash_currency_name,
        data.cash_currency_code,
        data.cash_currency_symbol,
        data.orig_amount,
        data.orig_currency_id,
        data.orig_currency_name,
        data.orig_currency_code,
        data.orig_currency_symbol,
        data.user_id,
        data.user_name,
        data.category_id,
        data.category_name,
        data.category_type,
        data.project_id,
        data.project_name,
        data.client_id,
        client,
        data.note,
        data.date,
        data.created_at,
        data.updated_at,
        data.orders || [],
        data.source_type || null,
        data.source_id || null,
        data.is_deleted || false
      );
    }).filter(Boolean);
  }
}
