import api from "./axiosInstance";
import CurrencyHistoryDto from "@/dto/currency/CurrencyHistoryDto";

/**
 * Контроллер для работы с историей валют
 * @class CurrencyHistoryController
 */
export default class CurrencyHistoryController {
  /**
   * Получить валюты с курсами
   * @returns {Promise<Array>} Массив валют с курсами
   */
  static async getCurrenciesWithRates() {
    const response = await api.get("/currency-history/currencies");
    return response.data;
  }

  /**
   * Получить историю валюты с пагинацией
   * @param {number|string} currencyId - ID валюты
   * @param {number} [page=1] - Номер страницы
   * @param {number} [per_page=20] - Количество элементов на странице
   * @returns {Promise<Object>} Объект с историей валюты и пагинацией
   */
  static async getCurrencyHistory(currencyId, page = 1, per_page = 20) {
    const response = await api.get(`/currency-history/${currencyId}`, {
      params: { page, per_page }
    });
    const data = response.data;

    return {
      currency: data.currency,
      history: CurrencyHistoryDto.fromApiArray(data.history),
      currentPage: data.current_page,
      lastPage: data.last_page,
      total: data.total,
    };
  }

  /**
   * Создать новую запись в истории валюты
   * @param {number|string} currencyId - ID валюты
   * @param {Object} item - Данные истории (exchangeRate, startDate, endDate)
   * @returns {Promise<Object>} Ответ от сервера с созданной записью
   */
  static async storeItem(currencyId, item) {
    const response = await api.post(`/currency-history/${currencyId}`, {
      exchange_rate: item.exchangeRate,
      start_date: item.startDate,
      end_date: item.endDate || null,
    });

    return {
      message: response.data.message || null,
      history:
        CurrencyHistoryDto.fromApiArray([response.data])[0] || null,
    };
  }

  /**
   * Обновить запись в истории валюты
   * @param {number|string} currencyId - ID валюты
   * @param {number|string} historyId - ID записи истории
   * @param {Object} item - Данные истории (exchangeRate, startDate, endDate)
   * @returns {Promise<Object>} Ответ от сервера с обновленной записью
   */
  static async updateItem(currencyId, historyId, item) {
    const response = await api.put(
      `/currency-history/${currencyId}/${historyId}`,
      {
        exchange_rate: item.exchangeRate,
        start_date: item.startDate,
        end_date: item.endDate || null,
      }
    );

    return {
      message: response.data.message || null,
      history:
        CurrencyHistoryDto.fromApiArray([response.data.history])[0] || null,
    };
  }

  /**
   * Удалить запись из истории валюты
   * @param {number|string} currencyId - ID валюты
   * @param {number|string} historyId - ID записи истории
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async deleteItem(currencyId, historyId) {
    const response = await api.delete(
      `/currency-history/${currencyId}/${historyId}`
    );
    return response.data;
  }
}
