import { formatNumber } from '@/utils/numberUtils';
import { dtoDateFormatters } from '@/utils/dateUtils';
import { createFromApiArray } from '@/utils/dtoUtils';

export default class ProjectBalanceHistoryDto {
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
    origAmount = null,
    categoryName = null
  ) {
    this.source = source;
    this.sourceId = sourceId;
    this.date = date;
    this.amount = amount;
    this.note = note;
    this.userName = userName;
    this.isDebt = isDebt;
    this.sourceType = sourceType;
    this.sourceSourceId = sourceSourceId || sourceId;
    this.cashCurrencySymbol = cashCurrencySymbol;
    this.origAmount = origAmount;
    this.categoryName = categoryName;
  }

  get dateUser() {
    return this.formatDate();
  }

  formatDate() {
    return dtoDateFormatters.formatDate(this.date);
  }


  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, data => {
      return new ProjectBalanceHistoryDto(
        data.source,
        data.source_id || data.sourceId,
        data.date,
        data.amount,
        data.note || '',
        data.user_name || '',
        data.is_debt || false,
        data.source_type || null,
        data.source_source_id || data.sourceId || null,
        data.cash_currency_symbol || null,
        data.orig_amount || null,
        data.category_name || data.categoryName || null
      );
    }).filter(Boolean);
  }
}
