import { dtoDateFormatters } from "@/utils/dateUtils";
import { createFromApiArray } from "@/utils/dtoUtils";
import { formatNumber } from "@/utils/numberUtils";
export default class ClientBalanceHistoryDto {
  constructor(source, sourceId, date, amount, description, userName = null, sourceType = null, note = null, isDebt = null, sourceSourceId = null, currencySymbol = null, categoryName = null, balanceDelta = null, projectName = null) {
    this.source = source;
    this.sourceId = sourceId;
    this.sourceSourceId = sourceSourceId;
    this.date = date;
    this.amount = parseFloat(amount) || 0;
    this.description = description;
    this.userName = userName;
    this.user_name = userName;
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
        data.user_name,
        data.source_type,
        data.note,
        data.is_debt,
        data.source_source_id || data.sourceSourceId || null,
        data.currency_symbol || data.currencySymbol || null,
        data.category_name || data.categoryName || null,
        data.balance_delta || data.balanceDelta || null,
        data.project_name ?? null
      );
    }).filter(Boolean);
  }
}
