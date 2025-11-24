import BaseController from "./BaseController";
import TransferDto from "@/dto/transfer/TransferDto";

/**
 * Контроллер для работы с переводами
 * @class TransferController
 */
export default class TransferController {
  /**
   * Получить список переводов с пагинацией
   * @param {number} [page=1] - Номер страницы
   * @param {number} [per_page=20] - Количество элементов на странице
   * @returns {Promise<PaginatedResponse>} Объект с пагинированными данными
   */
  static async getItems(page = 1, per_page = 20) {
    return BaseController.getItems('/transfers', TransferDto, page, per_page);
  }

  /**
   * Создать новый перевод
   * @param {Object} item - Данные перевода
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async storeItem(item) {
    return BaseController.storeItem('/transfers', item);
  }

  /**
   * Обновить перевод
   * @param {number|string} id - ID перевода
   * @param {Object} item - Данные перевода
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async updateItem(id, item) {
    return BaseController.updateItem('/transfers', id, item);
  }

  /**
   * Удалить перевод
   * @param {number|string} id - ID перевода
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async deleteItem(id) {
    return BaseController.deleteItem('/transfers', id);
  }
}
