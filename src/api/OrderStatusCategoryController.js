import BaseController from "./BaseController";
import OrderStatusCategoryDto from "@/dto/order/OrderStatusCategoryDto";

/**
 * Контроллер для работы с категориями статусов заказов
 * @class OrderStatusCategoryController
 */
export default class OrderStatusCategoryController {
  /**
   * Получить список категорий статусов заказов с пагинацией
   * @param {number} [page=1] - Номер страницы
   * @param {number} [per_page=20] - Количество элементов на странице
   * @returns {Promise<PaginatedResponse>} Объект с пагинированными данными
   */
  static async getItems(page = 1, per_page = 20) {
    return BaseController.getItems('/order_status_categories', OrderStatusCategoryDto, page, per_page);
  }

  /**
   * Получить все категории статусов заказов без пагинации
   * @returns {Promise<Array<OrderStatusCategoryDto>>} Массив категорий
   */
  static async getAllItems() {
    return BaseController.getAllItems('/order_status_categories', OrderStatusCategoryDto);
  }

  /**
   * Создать новую категорию статуса заказа
   * @param {Object} item - Данные категории
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async storeItem(item) {
    return BaseController.storeItem('/order_status_categories', item);
  }

  /**
   * Обновить категорию статуса заказа
   * @param {number|string} id - ID категории
   * @param {Object} item - Данные категории
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async updateItem(id, item) {
    return BaseController.updateItem('/order_status_categories', id, item);
  }

  /**
   * Удалить категорию статуса заказа
   * @param {number|string} id - ID категории
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async deleteItem(id) {
    return BaseController.deleteItem('/order_status_categories', id);
  }
}
