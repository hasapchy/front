import BaseController from "./BaseController";
import WarehouseMovementDto from "@/dto/warehouse/WarehouseMovementDto";

/**
 * Контроллер для работы с перемещениями между складами
 * @class WarehouseMovementController
 */
export default class WarehouseMovementController {
  /**
   * Получить список перемещений между складами с пагинацией
   * @param {number} [page=1] - Номер страницы
   * @param {number} [per_page=20] - Количество элементов на странице
   * @returns {Promise<PaginatedResponse>} Объект с пагинированными данными
   */
  static async getItems(page = 1, per_page = 20) {
    return BaseController.getItems('/warehouse_movements', WarehouseMovementDto, page, per_page);
  }

  /**
   * Создать новое перемещение между складами
   * @param {Object} item - Данные перемещения
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async storeItem(item) {
    return BaseController.storeItem('/warehouse_movements', item);
  }

  /**
   * Обновить перемещение между складами
   * @param {number|string} id - ID перемещения
   * @param {Object} item - Данные перемещения
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async updateItem(id, item) {
    return BaseController.updateItem('/warehouse_movements', id, item);
  }

  /**
   * Удалить перемещение между складами
   * @param {number|string} id - ID перемещения
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async deleteItem(id) {
    return BaseController.deleteItem('/warehouse_movements', id);
  }
}
