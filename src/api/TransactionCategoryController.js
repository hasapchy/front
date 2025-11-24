import BaseController from "./BaseController";
import TransactionCategoryDto from "@/dto/transaction/TransactionCategoryDto";

/**
 * Контроллер для работы с категориями транзакций
 * @class TransactionCategoryController
 */
export default class TransactionCategoryController {
  /**
   * Получить список категорий транзакций с пагинацией
   * @param {number} [page=1] - Номер страницы
   * @param {number} [per_page=20] - Количество элементов на странице
   * @returns {Promise<PaginatedResponse>} Объект с пагинированными данными
   */
  static async getItems(page = 1, per_page = 20) {
    return BaseController.getItems('/transaction_categories', TransactionCategoryDto, page, per_page);
  }

  /**
   * Получить все категории транзакций без пагинации
   * @returns {Promise<Array<TransactionCategoryDto>>} Массив категорий
   */
  static async getAllItems() {
    return BaseController.getAllItems('/transaction_categories', TransactionCategoryDto);
  }

  /**
   * Создать новую категорию транзакции
   * @param {Object} item - Данные категории
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async storeItem(item) {
    return BaseController.storeItem('/transaction_categories', item);
  }

  /**
   * Обновить категорию транзакции
   * @param {number|string} id - ID категории
   * @param {Object} item - Данные категории
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async updateItem(id, item) {
    return BaseController.updateItem('/transaction_categories', id, item);
  }

  /**
   * Удалить категорию транзакции
   * @param {number|string} id - ID категории
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async deleteItem(id) {
    return BaseController.deleteItem('/transaction_categories', id);
  }
}
