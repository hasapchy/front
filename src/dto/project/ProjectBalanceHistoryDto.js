import { dtoDateFormatters } from '@/utils/dateUtils';
import { createFromApiArray } from '@/utils/dtoUtils';

export default class ProjectBalanceHistoryDto {
  constructor(
    source,
    sourceId,
    date,
    amount,
    note = '',
    creator = null,
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
    this.creator = creator;
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
        data.source_id,
        data.date,
        data.amount,
        data.note,
        data.creator,
        Boolean(data.is_debt),
        data.source_type,
        data.source_source_id,
        data.cash_currency_symbol,
        data.orig_amount,
        data.category_name
      );
    }).filter(Boolean);
  }
}
