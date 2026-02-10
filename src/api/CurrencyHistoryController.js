import api from "./axiosInstance";
import CurrencyHistoryDto from "@/dto/currency/CurrencyHistoryDto";
import BaseController from "./BaseController";

export default class CurrencyHistoryController extends BaseController {
  
  /** Возвращает массив валют с курсами; при 204 или пустом ответе — пустой массив. */
  static async getCurrenciesWithRates() {
    return super.handleRequest(async () => {
      const response = await api.get("/currency-history/currencies");
      const data = response.data;
      return Array.isArray(data) ? data : [];
    }, "Error fetching currencies with rates:");
  }

  static async getItems(currencyId, page = 1, per_page = 20) {
    return super.handleRequest(async () => {
      const response = await api.get(`/currency-history/${currencyId}`, {
        params: { page, per_page },
      });
      const data = response.data;

      return {
        currency: data.currency,
        history: CurrencyHistoryDto.fromApiArray(data.history || []),
        currentPage: data.current_page,
        lastPage: data.last_page,
        total: data.total,
      };
    }, "Error fetching currency history:");
  }

  static async storeItem(currencyId, item) {
    return super.handleRequest(async () => {
      const response = await api.post(`/currency-history/${currencyId}`, {
        exchange_rate: item.exchangeRate,
        start_date: item.startDate,
        end_date: item.endDate || null,
      });

      return {
        message: response.data.message,
        history:
          CurrencyHistoryDto.fromApiArray([response.data.history])[0] || null,
      };
    }, "Error creating currency history item:");
  }

  static async updateItem(currencyId, historyId, item) {
    return super.handleRequest(async () => {
      const response = await api.put(
        `/currency-history/${currencyId}/${historyId}`,
        {
          exchange_rate: item.exchangeRate,
          start_date: item.startDate,
          end_date: item.endDate || null,
        }
      );

      return {
        message: response.data.message,
        history:
          CurrencyHistoryDto.fromApiArray([response.data.history])[0] || null,
      };
    }, "Error updating currency history item:");
  }

  static async deleteItem(currencyId, historyId) {
    return super.handleRequest(async () => {
      const response = await api.delete(
        `/currency-history/${currencyId}/${historyId}`
      );
      return response.data;
    }, "Error deleting currency history item:");
  }
}
