import BaseController from "./BaseController";
import OrderCategoryDto from "@/dto/order/OrderCategoryDto";

/**
 * Контроллер для работы с категориями заказов
 * @class OrderCategoryController
 */
export default class OrderCategoryController {
  /**
   * Получить список категорий заказов с пагинацией
   * @param {number} [page=1] - Номер страницы
   * @param {number} [per_page=20] - Количество элементов на странице
   * @returns {Promise<PaginatedResponse>} Объект с пагинированными данными
   */
  static async getItems(page = 1, per_page = 20) {
    return BaseController.getItems('/order_categories', OrderCategoryDto, page, per_page);
  }

  /**
   * Получить все категории заказов без пагинации
   * @returns {Promise<Array<OrderCategoryDto>>} Массив категорий
   */
  static async getAllItems() {
    return BaseController.getAllItems('/order_categories', OrderCategoryDto);
  }

  /**
   * Создать новую категорию заказа
   * @param {Object} item - Данные категории
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async storeItem(item) {
    return BaseController.storeItem('/order_categories', item);
  }

  /**
   * Обновить категорию заказа
   * @param {number|string} id - ID категории
   * @param {Object} item - Данные категории
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async updateItem(id, item) {
    return BaseController.updateItem('/order_categories', id, item);
  }

  /**
   * Удалить категорию заказа
   * @param {number|string} id - ID категории
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async deleteItem(id) {
    return BaseController.deleteItem('/order_categories', id);
  }
}
