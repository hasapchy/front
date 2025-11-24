import BaseController from "./BaseController";

/**
 * Контроллер для работы с ролями
 * @class RolesController
 */
export default class RolesController {
  /**
   * Получить список ролей с пагинацией
   * @param {number} [page=1] - Номер страницы
   * @param {number} [per_page=20] - Количество элементов на странице
   * @param {string|null} [search=null] - Поисковый запрос
   * @returns {Promise<PaginatedResponse>} Объект с пагинированными данными
   */
  static async getItems(page = 1, per_page = 20, search = null) {
    const params = {
      ...(search && { search })
    };
    return BaseController.getItems('/roles', null, page, per_page, params);
  }

  /**
   * Получить все роли без пагинации
   * @returns {Promise<Array>} Массив ролей
   */
  static async getAllItems() {
    return BaseController.getAllItems('/roles', null);
  }

  /**
   * Получить роль по ID
   * @param {number|string} id - ID роли
   * @returns {Promise<Object>} Данные роли
   */
  static async getItem(id) {
    return BaseController.getItem('/roles', null, id);
  }

  /**
   * Создать новую роль
   * @param {Object} payload - Данные роли
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async storeItem(payload) {
    return BaseController.storeItem('/roles', payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Обновить роль
   * @param {number|string} id - ID роли
   * @param {Object} payload - Данные роли
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async updateItem(id, payload) {
    return BaseController.updateItem('/roles', id, payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Удалить роль
   * @param {number|string} id - ID роли
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async deleteItem(id) {
    return BaseController.deleteItem('/roles', id);
  }
}

