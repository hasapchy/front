import BaseController from "./BaseController";
import ProjectStatusDto from "@/dto/project/ProjectStatusDto";

/**
 * Контроллер для работы со статусами проектов
 * @class ProjectStatusController
 */
export default class ProjectStatusController {
  /**
   * Получить все статусы проектов без пагинации
   * @returns {Promise<Array<ProjectStatusDto>>} Массив статусов
   */
  static async getAllItems() {
    return BaseController.getAllItems('/project-statuses', ProjectStatusDto);
  }

  /**
   * Получить список статусов проектов с пагинацией
   * @param {number} [page=1] - Номер страницы
   * @param {number} [per_page=20] - Количество элементов на странице
   * @returns {Promise<PaginatedResponse>} Объект с пагинированными данными
   */
  static async getItems(page = 1, per_page = 20) {
    return BaseController.getItems('/project-statuses', ProjectStatusDto, page, per_page);
  }

  /**
   * Создать новый статус проекта
   * @param {Object} item - Данные статуса
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async storeItem(item) {
    return BaseController.storeItem('/project-statuses', item);
  }

  /**
   * Обновить статус проекта
   * @param {number|string} id - ID статуса
   * @param {Object} item - Данные статуса
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async updateItem(id, item) {
    return BaseController.updateItem('/project-statuses', id, item);
  }

  /**
   * Удалить статус проекта
   * @param {number|string} id - ID статуса
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async deleteItem(id) {
    return BaseController.deleteItem('/project-statuses', id);
  }
}
