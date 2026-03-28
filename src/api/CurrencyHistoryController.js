import CurrencyHistoryDto from "@/dto/currency/CurrencyHistoryDto";
import BaseController from "./BaseController";

export default class CurrencyHistoryController extends BaseController {
  
  static async getItems(currencyId, page = 1, perPage = 20) {
    return super.handleRequest(async () => {
      const data = await super.getData(`/currency-history/${currencyId}`, {
        params: { page, per_page: perPage },
      });

      return {
        currency: data.currency,
        history: CurrencyHistoryDto.fromApiArray(data.history),
        currentPage: data.current_page,
        lastPage: data.last_page,
        total: data.total,
      };
    }, "Error fetching currency history:");
  }

  static async storeItem(currencyId, item) {
    return super.handleRequest(async () => {
      const response = await super.post(`/currency-history/${currencyId}`, {
        exchangeRate: item.exchangeRate,
        startDate: item.startDate,
        endDate: item.endDate || null,
      });

      return {
        message: response.data.message,
        history: CurrencyHistoryDto.fromApi(response.data.data),
      };
    }, "Error creating currency history item:");
  }

  static async updateItem(currencyId, historyId, item) {
    return super.handleRequest(async () => {
      const response = await super.put(
        `/currency-history/${currencyId}/${historyId}`,
        {
          exchangeRate: item.exchangeRate,
          startDate: item.startDate,
          endDate: item.endDate || null,
        }
      );

      return {
        message: response.data.message,
        history: CurrencyHistoryDto.fromApi(response.data.data),
      };
    }, "Error updating currency history item:");
  }

  static async deleteItem(currencyId, historyId) {
    return super.delete(`/currency-history/${currencyId}/${historyId}`);
  }
  static async getCurrenciesWithRates() {
    return super.get("/currency-history/currencies");
  }

  static async getAllItems(page = 1, perPage = 20) {
    return super.handleRequest(async () => {
      const data = await super.getData("/currency-history", {
        params: { page, per_page: perPage },
      });

      return {
        history: CurrencyHistoryDto.fromApiArray(data.history),
        currentPage: data.current_page,
        lastPage: data.last_page,
        total: data.total,
      };
    }, "Error fetching currency history:");
  }

}
