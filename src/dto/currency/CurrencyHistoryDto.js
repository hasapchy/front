import { dayjsDate, dayjsDateTime } from "@/utils/dateUtils";

export default class CurrencyHistoryDto {
  constructor(
    id,
    currencyId,
    exchangeRate,
    startDate,
    endDate = null,
    createdAt = "",
    updatedAt = "",
    currency = null
  ) {
    this.id = id;
    this.currencyId = currencyId;
    this.exchangeRate = exchangeRate;
    this.startDate = startDate;
    this.endDate = endDate;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.currency = currency;
  }

  formatStartDate() {
    return dayjsDate(this.startDate);
  }

  formatEndDate() {
    return this.endDate ? dayjsDate(this.endDate) : 'Текущий';
  }

  formatCreatedAt() {
    return dayjsDate(this.createdAt);
  }

  formatUpdatedAt() {
    return dayjsDate(this.updatedAt);
  }

  formatExchangeRate() {
    return Number(this.exchangeRate).toFixed(6);
  }

  isActive() {
    if (!this.endDate) return true;
    const today = new Date().toISOString().split('T')[0];
    return this.endDate >= today;
  }

  getDuration() {
    if (!this.endDate) {
      const start = new Date(this.startDate);
      const today = new Date();
      const diffTime = Math.abs(today - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `${diffDays} дней`;
    }
    
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} дней`;
  }

  static fromApi(data) {
    return new CurrencyHistoryDto(
      data.id,
      data.currency_id,
      data.exchange_rate,
      data.start_date,
      data.end_date,
      data.created_at,
      data.updated_at,
      data.currency
    );
  }
}
