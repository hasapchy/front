import BaseController from "./BaseController";
import WarehouseReceiptDto from "@/dto/warehouse/WarehouseReceiptDto";

/**
 * Контроллер для работы с поступлениями на склад
 * @class WarehouseReceiptController
 */
export default class WarehouseReceiptController {
  /**
   * Получить список поступлений на склад с пагинацией
   * @param {number} [page=1] - Номер страницы
   * @param {number} [per_page=20] - Количество элементов на странице
   * @returns {Promise<PaginatedResponse>} Объект с пагинированными данными
   */
  static async getItems(page = 1, per_page = 20) {
    return BaseController.getItems('/warehouse_receipts', WarehouseReceiptDto, page, per_page);
  }

  /**
   * Создать новое поступление на склад
   * @param {Object} item - Данные поступления
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async storeItem(item) {
    return BaseController.storeItem('/warehouse_receipts', item);
  }

  /**
   * Обновить поступление на склад
   * @param {number|string} id - ID поступления
   * @param {Object} item - Данные поступления
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async updateItem(id, item) {
    return BaseController.updateItem('/warehouse_receipts', id, item);
  }

  /**
   * Удалить поступление на склад
   * @param {number|string} id - ID поступления
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async deleteItem(id) {
    return BaseController.deleteItem('/warehouse_receipts', id);
  }

  /**
   * Получить поступление на склад по ID
   * @param {number|string} id - ID поступления
   * @returns {Promise<WarehouseReceiptDto|null>} Поступление или null
   */
  static async getItem(id) {
    return BaseController.getItem('/warehouse_receipts', WarehouseReceiptDto, id);
  }
}
