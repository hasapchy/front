import { dayjsDate, dayjsDateTime } from "@/utils/dateUtils";
export default class ClientBalanceHistoryDto {
  constructor(source, sourceId, date, amount, description) {
    this.source = source; // тип источника: 'sale', 'receipt', 'transaction', 'order'
    this.sourceId = sourceId; // ID записи
    this.date = date; // дата
    this.amount = typeof amount === 'number' ? amount : 0; // сумма со знаком
    this.description = description; // описание
  }

  formattedAmount() {
    const sign = this.amount >= 0 ? "+" : "-";
    return `${sign}${Math.abs(this.amount).toFixed(2)}`;
  }

  formatDate() {
    return dayjsDateTime(this.date);
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
