import { formatNumber } from '@/utils/numberUtils';
import { formatAmountWithStyle, createFromApiArray, normalizeNumber } from '@/utils/dtoUtils';
import BaseDto from "@/dto/BaseDto";

export default class ProjectBalanceHistoryDto extends BaseDto {
  constructor(
    source,
    sourceId,
    date,
    amount,
    note = '',
    userName = '',
    isDebt = false,
    sourceType = null,
    sourceSourceId = null,
    cashCurrencySymbol = null,
    origAmount = null
  ) {
    this.source = source;
    this.sourceId = sourceId;
    this.date = date;
    this.amount = amount;
    this.note = note;
    this.userName = userName;
    this.isDebt = isDebt;
    this.sourceType = sourceType;
    this.sourceSourceId = sourceSourceId ?? sourceId;
    this.cashCurrencySymbol = cashCurrencySymbol;
    this.origAmount = origAmount;
  }

  formatAmountWithColor(projectCurrency, formatNumberFn = formatNumber) {
    const currency = projectCurrency ?? 'Нет валюты';
    
    if (this.cashCurrencySymbol && this.origAmount) {
      const originalAmount = normalizeNumber(this.origAmount) ?? 0;
      const originalSymbol = this.cashCurrencySymbol;
      
      if (originalSymbol !== currency) {
        const formattedVal = formatNumberFn(this.amount, null, true);
        const formattedOrig = formatNumberFn(originalAmount, null, true);
        const color = this.amount >= 0 ? "#5CB85C" : "#EE4F47";
        return `<span style="color:${color};font-weight:bold">${formattedVal} ${currency} (${formattedOrig} ${originalSymbol})</span>`;
      }
    }
    
    return formatAmountWithStyle(this.amount, currency, (val) => formatNumberFn(val, null, true));
  }

  getSourceTypeHtml() {
    switch (this.source) {
      case "transaction": 
        return '<i class="fas fa-circle text-[#6C757D] mr-2"></i> Прочее';
      case "sale": 
        return '<i class="fas fa-shopping-cart text-[#5CB85C] mr-2"></i> Продажа';
      case "order": 
        return '<i class="fas fa-file-invoice text-[#337AB7] mr-2"></i> Заказ';
      case "receipt": 
        return '<i class="fas fa-box text-[#FFA500] mr-2"></i> Оприходование';
      default: 
        return this.source;
    }
  }

  getDebtHtml() {
    return this.isDebt == 1
      ? '<i class="fas fa-check text-green-500"></i>'
      : '<i class="fas fa-times text-red-500"></i>';
  }

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, data => {
      return new ProjectBalanceHistoryDto(
        data.source,
        data.source_id,
        data.date,
        data.amount,
        data.note ?? '',
        data.user_name ?? '',
        data.is_debt ?? false,
        data.source_type,
        data.source_source_id,
        data.cash_currency_symbol,
        data.orig_amount
      );
    });
  }
}
