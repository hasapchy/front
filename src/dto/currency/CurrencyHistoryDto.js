import { dtoDateFormatters, getCurrentServerDate, getCurrentServerDateObject } from "@/utils/dateUtils";
import { formatNumber } from "@/utils/numberUtils";
import { createFromApiArray } from "@/utils/dtoUtils";
import { dt } from "@/utils/displayI18n";

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
    return this.endDate ? dtoDateFormatters.formatCreatedAt(this.endDate) : dt('currencyHistoryCurrent');
  }

  formatCreatedAt() {
    return dtoDateFormatters.formatCreatedAt(this.createdAt);
  }
  formatExchangeRate() {
    return formatNumber(this.exchangeRate, 6, true);
  }

  isActive() {
    if (!this.endDate) return true;
    return this.endDate >= getCurrentServerDate();
  }

  getDuration() {
    if (!this.endDate) {
      const start = new Date(this.startDate);
      const today = getCurrentServerDateObject();
      const diffTime = Math.abs(today - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return dt('currencyHistoryDays', { n: diffDays });
    }
    
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return dt('currencyHistoryDays', { n: diffDays });
  }

  static fromApi(data) {
    if (!data) return null;
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

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, CurrencyHistoryDto.fromApi).filter(Boolean);
  }
}
