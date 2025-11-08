import { dtoDateFormatters } from "@/utils/dateUtils";
import { formatNumber } from "@/utils/numberUtils";
import { createFromApiArray } from "@/utils/dtoUtils";

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
    return dtoDateFormatters.formatCreatedAt(this.startDate);
  }

  formatEndDate() {
    return this.endDate ? dtoDateFormatters.formatCreatedAt(this.endDate) : 'Текущий';
  }

  formatCreatedAt() {
    return dtoDateFormatters.formatCreatedAt(this.createdAt);
  }

  formatUpdatedAt() {
    return dtoDateFormatters.formatUpdatedAt(this.updatedAt);
  }

  formatExchangeRate() {
    return formatNumber(this.exchangeRate, 6, true);
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

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, data => {
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
    }).filter(Boolean);
  }
}
