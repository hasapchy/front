import BaseController from "./BaseController";
import api from "./axiosInstance";
import CashRegisterBalanceDto from "@/dto/cash_register/CashRegisterBalanceDto";
import CashRegisterDto from "@/dto/cash_register/CashRegisterDto";

/**
 * Контроллер для работы с кассами
 * @class CashRegisterController
 */
export default class CashRegisterController {
  /**
   * Получить список касс с пагинацией
   * @param {number} [page=1] - Номер страницы
   * @param {number} [per_page=20] - Количество элементов на странице
   * @returns {Promise<PaginatedResponse>} Объект с пагинированными данными
   */
  static async getItems(page = 1, per_page = 20) {
    return BaseController.getItems('/cash_registers', CashRegisterDto, page, per_page);
  }

  /**
   * Получить все кассы без пагинации
   * @returns {Promise<Array<CashRegisterDto>>} Массив касс
   */
  static async getAllItems() {
    return BaseController.getAllItems('/cash_registers', CashRegisterDto);
  }

  /**
   * Получить баланс касс
   * @param {Array<number|string>} [cashIds=[]] - Массив ID касс
   * @param {string|null} [startDate=null] - Начальная дата
   * @param {string|null} [endDate=null] - Конечная дата
   * @param {Object} [additionalParams={}] - Дополнительные параметры (transaction_type, source)
   * @returns {Promise<Array<CashRegisterBalanceDto>>} Массив балансов касс
   */
  static async getCashBalance(cashIds = [], startDate = null, endDate = null, additionalParams = {}) {
    const params = {
      ...(cashIds.length && { cash_register_ids: cashIds.join(",") }),
      ...(startDate && { start_date: startDate }),
      ...(endDate && { end_date: endDate }),
      ...(additionalParams.transaction_type && { transaction_type: additionalParams.transaction_type }),
      ...(additionalParams.source && { source: additionalParams.source })
    };

    const response = await api.get("/cash_registers/balance", { params });
    return CashRegisterBalanceDto.fromApiArray(response.data.data);
  }

  /**
   * Создать новую кассу
   * @param {Object} item - Данные кассы
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async storeItem(item) {
    return BaseController.storeItem('/cash_registers', item);
  }

  /**
   * Обновить кассу
   * @param {number|string} id - ID кассы
   * @param {Object} item - Данные кассы
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async updateItem(id, item) {
    return BaseController.updateItem('/cash_registers', id, item);
  }

  /**
   * Удалить кассу
   * @param {number|string} id - ID кассы
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async deleteItem(id) {
    return BaseController.deleteItem('/cash_registers', id);
  }
}
