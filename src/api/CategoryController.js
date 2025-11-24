import BaseController from "./BaseController";
import CategoryDto from "@/dto/category/CategoryDto";
import api from "./axiosInstance";

/**
 * Контроллер для работы с категориями
 * @class CategoryController
 */
export default class CategoryController {
  /**
   * Получить список категорий с пагинацией
   * @param {number} [page=1] - Номер страницы
   * @param {number} [per_page=20] - Количество элементов на странице
   * @returns {Promise<PaginatedResponse>} Объект с пагинированными данными
   */
  static async getItems(page = 1, per_page = 20) {
    return BaseController.getItems('/categories', CategoryDto, page, per_page);
  }

  /**
   * Получить все категории без пагинации
   * @returns {Promise<Array<CategoryDto>>} Массив категорий
   */
  static async getAllItems() {
    return BaseController.getAllItems('/categories', CategoryDto);
  }

  /**
   * Получить родительские категории
   * @returns {Promise<Array>} Массив родительских категорий
   */
  static async getParentCategories() {
    const response = await api.get('/categories/parents');
    return response.data;
  }

  /**
   * Создать новую категорию
   * @param {Object} item - Данные категории
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async storeItem(item) {
    return BaseController.storeItem('/categories', item);
  }

  /**
   * Обновить категорию
   * @param {number|string} id - ID категории
   * @param {Object} item - Данные категории
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async updateItem(id, item) {
    return BaseController.updateItem('/categories', id, item);
  }

  /**
   * Удалить категорию
   * @param {number|string} id - ID категории
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async deleteItem(id) {
    return BaseController.deleteItem('/categories', id);
  }
}
