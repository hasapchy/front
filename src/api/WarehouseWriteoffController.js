import BaseController from "./BaseController";
import WarehouseWriteoffDto from "@/dto/warehouse/WarehouseWriteoffDto";

/**
 * Контроллер для работы со списаниями со склада
 * @class WarehouseWriteoffController
 */
export default class WarehouseWriteoffController {
  /**
   * Получить список списаний со склада с пагинацией
   * @param {number} [page=1] - Номер страницы
   * @param {number} [per_page=20] - Количество элементов на странице
   * @returns {Promise<PaginatedResponse>} Объект с пагинированными данными
   */
  static async getItems(page = 1, per_page = 20) {
    return BaseController.getItems('/warehouse_writeoffs', WarehouseWriteoffDto, page, per_page);
  }

  /**
   * Создать новое списание со склада
   * @param {Object} item - Данные списания
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async storeItem(item) {
    return BaseController.storeItem('/warehouse_writeoffs', item);
  }

  /**
   * Обновить списание со склада
   * @param {number|string} id - ID списания
   * @param {Object} item - Данные списания
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async updateItem(id, item) {
    return BaseController.updateItem('/warehouse_writeoffs', id, item);
  }

  /**
   * Удалить списание со склада
   * @param {number|string} id - ID списания
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async deleteItem(id) {
    return BaseController.deleteItem('/warehouse_writeoffs', id);
  }
}
