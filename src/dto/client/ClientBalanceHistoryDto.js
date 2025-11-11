import { dtoDateFormatters } from "@/utils/dateUtils";
import { formatAmountWithColor, formatAmountWithStyle, formatAmountWithSignAndColor, formatAmountSimple, createFromApiArray } from "@/utils/dtoUtils";
import { formatNumber } from "@/utils/numberUtils";
export default class ClientBalanceHistoryDto {
  constructor(source, sourceId, date, amount, description, userName = null, sourceType = null, note = null, isDebt = null, sourceSourceId = null, currencySymbol = null, currencyCode = null) {
    this.source = source;
    this.sourceId = sourceId;
    this.sourceSourceId = sourceSourceId;
    this.date = date;
    this.amount = parseFloat(amount) || 0;
    this.description = description;
    this.userName = userName;
    this.sourceType = sourceType;
    this.note = note;
    this.isDebt = isDebt;
    this.currencySymbol = currencySymbol;
    this.currencyCode = currencyCode;
  }

  formattedAmount() {
    const sign = this.amount >= 0 ? "+" : "-";
    return `${sign}${formatNumber(Math.abs(this.amount), null, true)}`;
  }

  formatDate() {
    return dtoDateFormatters.formatDate(this.date);
  }

  label() {
    const sourceMap = {
      'sale': 'Продажа',
      'receipt': 'Оприходование',
      'transaction': 'Транзакция',
      'order': 'Заказ',
      'App\\Models\\Sale': 'Продажа',
      'App\\Models\\Order': 'Заказ',
      'App\\Models\\WarehouseReceipt': 'Оприходование',
      'App\\Models\\Transaction': 'Транзакция'
    };
    
    return sourceMap[this.source] || sourceMap[this.sourceType] || 'Операция';
  }
  formatAmountWithColor() {
    return formatAmountWithColor(this.amount);
  }

  get dateUser() {
    return this.formatDate();
  }

  formatAmountWithColorAndCurrency(currencyCode) {
    const symbol = this.currencySymbol || currencyCode;
    return formatAmountWithStyle(this.amount, symbol);
  }

  getBalanceLabel() {
    if (parseFloat(this.amount) > 0) {
      return '<i class="fas fa-arrow-up text-red-500 mr-2"></i> Долг клиента';
    }
    return '<i class="fas fa-arrow-down text-green-500 mr-2"></i> Оплата клиента';
  }

  getOperationTypeHtml() {
    const amount = parseFloat(this.amount);
    const isDebt = this.isDebt == 1;
    
    if (amount > 0 && isDebt) {
      return '<i class="fas fa-arrow-up text-[#EE4F47] mr-2"></i><span class="text-[#EE4F47]">Кредит клиента</span>';
    }
    if (amount > 0 && !isDebt) {
      return '<i class="fas fa-check text-[#5CB85C] mr-2"></i><span class="text-[#5CB85C]">Оплачено</span>';
    }
    if (amount < 0) {
      return '<i class="fas fa-arrow-down text-[#5CB85C] mr-2"></i><span class="text-[#5CB85C]">Оплата клиента</span>';
    }
    return '<i class="fas fa-exchange-alt text-gray-500 mr-2"></i><span class="text-gray-500">Транзакция</span>';
  }

  getPaymentOperationTypeHtml() {
    const amount = parseFloat(this.amount);
    return amount > 0
      ? '<i class="fas fa-check text-[#5CB85C] mr-2"></i><span class="text-[#5CB85C]">Оплата получена</span>'
      : '<i class="fas fa-exchange-alt text-gray-500 mr-2"></i><span class="text-gray-500">Оплата</span>';
  }

  getSourceTypeHtml() {
    const sourceMap = {
      'sale': { icon: 'fa-shopping-cart', color: 'text-[#5CB85C]', text: 'Продажа' },
      'order': { icon: 'fa-clipboard-list', color: 'text-[#337AB7]', text: 'Заказ' },
      'receipt': { icon: 'fa-box', color: 'text-[#FFA500]', text: 'Оприходование' },
      'transaction': { icon: 'fa-exchange-alt', color: 'text-[#6C757D]', text: 'Транзакция' }
    };
    
    const source = sourceMap[this.source] || sourceMap['transaction'];
    return `<i class="fas ${source.icon} ${source.color} mr-2"></i><span class="${source.color}">${source.text}</span>`;
  }

  getClientImpactHtml(currencyCode, formatNumberFn = null) {
    const formatFn = formatNumberFn || ((val) => formatNumber(val, null, true));
    const symbol = this.currencySymbol || currencyCode;
    return formatAmountWithSignAndColor(this.amount, symbol, (val) => formatFn(Math.abs(val)), this.isDebt == 1);
  }

  getPaymentImpactHtml(currencyCode, formatNumberFn = null) {
    const formatFn = formatNumberFn || ((val) => formatNumber(val, null, true));
    const symbol = this.currencySymbol || currencyCode;
    return formatAmountSimple(this.amount, symbol, (val) => formatFn(Math.abs(val)));
  }

  getDebtHtml() {
    return this.isDebt == 1 ? '<span class="text-green-500 font-bold">✓</span>' : '<span class="text-gray-400">-</span>';
  }

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, data => {
      return new ClientBalanceHistoryDto(
        data.source,
        data.source_id,
        data.date,
        data.amount,
        data.description,
        data.user_name,
        data.source_type,
        data.note,
        data.is_debt,
        data.source_source_id || data.sourceSourceId || null,
        data.currency_symbol || data.currencySymbol || null,
        data.currency_code || data.currencyCode || null
      );
    }).filter(Boolean);
  }
}
