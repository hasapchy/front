import UnitDto from "../dto/app/UnitDto";
import CurrencyDto from "../dto/app/CurrencyDto";
import api from "./axiosInstance";

/**
 * Контроллер для работы с общими данными приложения
 * @class AppController
 */
class AppController {
  /**
   * Получить список валют
   * @returns {Promise<Array<CurrencyDto>>} Массив валют
   */
  async getCurrencies() {
    const response = await api.get("/app/currency");
    return CurrencyDto.fromApiArray(response.data.data);
  }

  /**
   * Получить список единиц измерения
   * @returns {Promise<Array<UnitDto>>} Массив единиц измерения
   */
  async getUnits() {
    const response = await api.get("/app/units");
    return UnitDto.fromApiArray(response.data.data);
  }

  /**
   * Получить курс обмена валюты
   * @param {number|string} currencyId - ID валюты
   * @returns {Promise<Object>} Данные курса обмена
   */
  async getCurrencyExchangeRate(currencyId) {
    const response = await api.get(`/app/currency/${currencyId}/exchange-rate`);
    return response.data;
  }
}

export default new AppController();
