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
  static async getCurrencyHistory(currencyId) {
    try {
      const response = await api.get(`/currency-history/${currencyId}`);
      const data = response.data;
      
      return {
        currency: data.currency,
        history: data.history.map(item => CurrencyHistoryDto.fromApi(item))
      };
    } catch (error) {
      console.error("Error fetching currency history:", error);
      throw error;
    }
  }

  // Создание новой записи в истории курсов
  static async createHistoryItem(currencyId, data) {
    try {
      const response = await api.post(`/currency-history/${currencyId}`, {
        exchange_rate: data.exchangeRate,
        start_date: data.startDate,
        end_date: data.endDate || null
      });
      
      return {
        message: response.data.message,
        history: CurrencyHistoryDto.fromApi(response.data.history)
      };
    } catch (error) {
      console.error("Error creating currency history item:", error);
      throw error;
    }
  }

  // Обновление записи в истории курсов
  static async updateHistoryItem(currencyId, historyId, data) {
    try {
      const response = await api.put(`/currency-history/${currencyId}/${historyId}`, {
        exchange_rate: data.exchangeRate,
        start_date: data.startDate,
        end_date: data.endDate || null
      });
      
      return {
        message: response.data.message,
        history: CurrencyHistoryDto.fromApi(response.data.history)
      };
    } catch (error) {
      console.error("Error updating currency history item:", error);
      throw error;
    }
  }

  // Удаление записи из истории курсов
  static async deleteHistoryItem(currencyId, historyId) {
    try {
      const response = await api.delete(`/currency-history/${currencyId}/${historyId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting currency history item:", error);
      throw error;
    }
  }
}
