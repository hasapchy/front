import { dayjsDateTime } from "@/utils/dateUtils";
export default class ClientBalanceHistoryDto {
  constructor(source, sourceId, date, amount, description, user_name = null, source_type = null, note = null, is_debt = null) {
    this.source = source; // тип источника: 'sale', 'receipt', 'transaction', 'order'
    this.sourceId = sourceId; // ID записи
    this.date = date; // дата
    this.amount = parseFloat(amount) || 0; // сумма со знаком
    this.description = description; // описание
    this.user_name = user_name; // имя пользователя
    this.source_type = source_type; // тип источника (App\Models\Sale, etc.)
    this.note = note; // примечание
    this.is_debt = is_debt; // долговая транзакция
  }

  formattedAmount() {
    const sign = this.amount >= 0 ? "+" : "-";
    return `${sign}${Math.abs(this.amount).toFixed(2)}`;
  }

  formatDate() {
    return dayjsDateTime(this.date);
  }

  getSourceTypeLabel() {
    if (!this.source_type) return 'Неизвестно';
    
    switch (this.source_type) {
      case 'App\\Models\\Sale':
        return 'Продажа';
      case 'App\\Models\\Order':
        return 'Заказ';
      case 'App\\Models\\WarehouseReceipt':
        return 'Оприходование';
      case 'App\\Models\\Transaction':
        return 'Транзакция';
      default:
        return 'Операция';
    }
  }

  label() {
    switch (this.source) {
      case "sale":
        return "Продажа";
      case "receipt":
        return "Оприходование";
      case "transaction":
        return "Транзакция";
      case "order":
        return "Заказ";
      default:
        return "Операция";
    }
  }
  formatAmountWithColor() {
    const amount = Math.abs(this.amount).toFixed(2);
    const sign = this.amount >= 0 ? "+" : "-";
    const colorClass =
      this.amount >= 0
        ? "text-[#5CB85C] font-semibold"
        : "text-[#EE4F47] font-semibold";
    return `<span class="${colorClass}">${sign}${amount}</span>`;
  }
}
