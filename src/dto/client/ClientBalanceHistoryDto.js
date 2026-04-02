import { dtoDateFormatters } from "@/utils/dateUtils";
import { createFromApiArray } from "@/utils/dtoUtils";
import { formatNumber } from "@/utils/numberUtils";
import { dt } from "@/utils/displayI18n";
export default class ClientBalanceHistoryDto {
  constructor(source, sourceId, date, amount, description, creator = null, sourceType = null, note = null, isDebt = null, sourceSourceId = null, currencySymbol = null, categoryName = null, balanceDelta = null, projectName = null) {
    this.source = source;
    this.sourceId = sourceId;
    this.sourceSourceId = sourceSourceId;
    this.date = date;
    this.amount = parseFloat(amount) || 0;
    this.description = description;
    this.creator = creator;
    this.sourceType = sourceType;
    this.note = note;
    this.isDebt = isDebt;
    this.currencySymbol = currencySymbol;
    this.categoryName = categoryName;
    this.balanceDelta = balanceDelta !== null && balanceDelta !== undefined ? parseFloat(balanceDelta) : null;
    this.projectName = projectName;
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
      'sale': dt('balanceSourceSale'),
      'receipt': dt('balanceSourceReceipt'),
      'transaction': dt('balanceSourceTransaction'),
      'order': dt('balanceSourceOrder'),
      'App\\Models\\Sale': dt('balanceSourceSale'),
      'App\\Models\\Order': dt('balanceSourceOrder'),
      'App\\Models\\WarehouseReceipt': dt('balanceSourceReceipt'),
      'App\\Models\\Transaction': dt('balanceSourceTransaction')
    };
    
    return sourceMap[this.source] || sourceMap[this.sourceType] || dt('balanceSourceOperation');
  }
  get dateUser() {
    return this.formatDate();
  }

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, data => {
      return new ClientBalanceHistoryDto(
        data.source,
        data.source_id,
        data.date,
        data.amount,
        data.description,
        data.creator ?? null,
        data.source_type,
        data.note,
        data.is_debt,
        data.source_source_id ?? null,
        data.currency_symbol ?? null,
        data.category_name ?? null,
        data.balance_delta ?? null,
        data.project_name ?? null
      );
    }).filter(Boolean);
  }
}
