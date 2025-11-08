import api from "./axiosInstance";
import CurrencyHistoryDto from "@/dto/currency/CurrencyHistoryDto";

export default class CurrencyHistoryController {
  // Получение всех валют с их текущими курсами
  static async getCurrenciesWithRates() {
    try {
      const response = await api.get("/currency-history/currencies");
      return response.data;
    } catch (error) {
      console.error("Error fetching currencies with rates:", error);
      throw error;
    }
  }

  // Получение истории курсов для конкретной валюты
  static async getCurrencyHistory(currencyId, page = 1, per_page = 20) {
    try {
      const response = await api.get(`/currency-history/${currencyId}?page=${page}&per_page=${per_page}`);
      const data = response.data;
      
      return {
        currency: data.currency,
        history: CurrencyHistoryDto.fromApiArray(data.history),
        currentPage: data.current_page,
        lastPage: data.last_page,
        total: data.total
      };
    } catch (error) {
      console.error("Error fetching currency history:", error);
      throw error;
    }
  }

  static async storeItem(currencyId, item) {
    try {
      const response = await api.post(`/currency-history/${currencyId}`, {
        exchange_rate: item.exchangeRate,
        start_date: item.startDate,
        end_date: item.endDate || null
      });
      
      return {
        message: response.data.message,
        history: CurrencyHistoryDto.fromApiArray([response.data.history])[0] || null
      };
    } catch (error) {
      console.error("Error creating currency history item:", error);
      throw error;
    }
  }

  static async createHistoryItem(currencyId, data) {
    return this.storeItem(currencyId, data);
  }

  static async updateItem(currencyId, historyId, item) {
    try {
      const response = await api.put(`/currency-history/${currencyId}/${historyId}`, {
        exchange_rate: item.exchangeRate,
        start_date: item.startDate,
        end_date: item.endDate || null
      });
      
      return {
        message: response.data.message,
        history: CurrencyHistoryDto.fromApiArray([response.data.history])[0] || null
      };
    } catch (error) {
      console.error("Error updating currency history item:", error);
      throw error;
    }
  }

  static async updateHistoryItem(currencyId, historyId, data) {
    return this.updateItem(currencyId, historyId, data);
  }

  static async deleteItem(currencyId, historyId) {
    try {
      const response = await api.delete(`/currency-history/${currencyId}/${historyId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting currency history item:", error);
      throw error;
    }
  }

  static async deleteHistoryItem(currencyId, historyId) {
    return this.deleteItem(currencyId, historyId);
  }
}
