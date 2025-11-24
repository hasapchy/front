import BaseController from "./BaseController";
import OrderStatusDto from "@/dto/order/OrderStatusDto";

/**
 * Контроллер для работы со статусами заказов
 * @class OrderStatusController
 */
export default class OrderStatusController {
  /**
   * Получить все статусы заказов без пагинации
   * @returns {Promise<Array<OrderStatusDto>>} Массив статусов
   */
  static async getAllItems() {
    return BaseController.getAllItems('/order_statuses', OrderStatusDto);
  }

  /**
   * Получить список статусов заказов с пагинацией
   * @param {number} [page=1] - Номер страницы
   * @param {number} [per_page=20] - Количество элементов на странице
   * @returns {Promise<PaginatedResponse>} Объект с пагинированными данными
   */
  static async getItems(page = 1, per_page = 20) {
    return BaseController.getItems('/order_statuses', OrderStatusDto, page, per_page);
  }

  /**
   * Создать новый статус заказа
   * @param {Object} item - Данные статуса
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async storeItem(item) {
    return BaseController.storeItem('/order_statuses', item);
  }

  /**
   * Обновить статус заказа
   * @param {number|string} id - ID статуса
   * @param {Object} item - Данные статуса
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async updateItem(id, item) {
    return BaseController.updateItem('/order_statuses', id, item);
  }

  /**
   * Удалить статус заказа
   * @param {number|string} id - ID статуса
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async deleteItem(id) {
    return BaseController.deleteItem('/order_statuses', id);
  }
}
