import BaseController from "./BaseController";
import api from "./axiosInstance";
import ProjectDto from "@/dto/project/ProjectDto";
import { queryCache } from "@/utils/cacheHelper";
import { createFormDataWithFiles } from "@/utils/formDataHelper";

/**
 * Контроллер для работы с проектами
 * @class ProjectController
 */
export default class ProjectController {
  /**
   * Получить список проектов с пагинацией
   * @param {number} [page=1] - Номер страницы
   * @param {Object} [params={}] - Дополнительные параметры фильтрации
   * @param {number} [per_page=20] - Количество элементов на странице
   * @returns {Promise<PaginatedResponse>} Объект с пагинированными данными
   */
  static async getItems(page = 1, params = {}, per_page = 20) {
    return BaseController.getItems('/projects', ProjectDto, page, per_page, params);
  }

  /**
   * Получить все активные проекты без пагинации
   * @returns {Promise<Array<ProjectDto>>} Массив проектов
   */
  static async getAllItems() {
    const response = await api.get('/projects/all', {
      params: { active_only: true }
    });
    return ProjectDto.fromApiArray(response.data.data);
  }

  /**
   * Получить проект по ID
   * @param {number|string} id - ID проекта
   * @returns {Promise<ProjectDto|null>} Проект или null
   */
  static async getItem(id) {
    return BaseController.getItem('/projects', ProjectDto, id);
  }

  /**
   * Создать новый проект
   * @param {Object} item - Данные проекта
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async storeItem(item) {
    return BaseController.storeItemWithCache("/projects", item, {
      cacheKeys: "projects_list"
    });
  }

  /**
   * Обновить проект
   * @param {number|string} id - ID проекта
   * @param {Object} item - Данные проекта
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async updateItem(id, item) {
    return BaseController.updateItemWithCache(`/projects`, id, item, {
      cacheKeys: "projects_list"
    });
  }

  /**
   * Удалить проект
   * @param {number|string} id - ID проекта
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async deleteItem(id) {
    return BaseController.deleteItem('/projects', id, 'projects_list');
  }

  /**
   * Загрузить файлы для проекта
   * @param {number|string} projectId - ID проекта
   * @param {Array<File>} files - Массив файлов для загрузки
   * @param {Object} [options={}] - Дополнительные опции (cancelToken, onProgress, timeout)
   * @returns {Promise<Array>} Массив загруженных файлов
   */
  static async uploadFiles(projectId, files, options = {}) {
    const formData = createFormDataWithFiles({}, files, 'files[]');

    const response = await api.post(
      `/projects/${projectId}/upload-files`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        cancelToken: options.cancelToken,
        onUploadProgress: options.onProgress,
        timeout: options.timeout || 60000,
      }
    );
    return response.data.files;
  }

  /**
   * Удалить файл проекта
   * @param {number|string} projectId - ID проекта
   * @param {string} filePath - Путь к файлу
   * @returns {Promise<Array>} Обновленный список файлов
   */
  static async deleteFile(projectId, filePath) {
    const response = await api.post(`/projects/${projectId}/delete-file`, {
      path: filePath,
    });
    return response.data.files;
  }

  /**
   * Получить историю баланса проекта
   * @param {number|string} projectId - ID проекта
   * @param {number|null} [timestamp=null] - Временная метка для фильтрации
   * @returns {Promise<Object>} Объект с историей, балансом и бюджетом
   */
  static async getBalanceHistory(projectId, timestamp = null) {
    const { data } = await api.get(`/projects/${projectId}/balance-history`, {
      ...(timestamp && { params: { t: timestamp } })
    });

    const ProjectBalanceHistoryDto = (
      await import("@/dto/project/ProjectBalanceHistoryDto")
    ).default;
    const history = ProjectBalanceHistoryDto.fromApiArray(data.history);

    return {
      history,
      balance: data.balance,
      budget: data.budget,
    };
  }

  /**
   * Получить детальный баланс проекта
   * @param {number|string} projectId - ID проекта
   * @returns {Promise<Object>} Детальный баланс проекта
   */
  static async getDetailedBalance(projectId) {
    const { data } = await api.get(`/projects/${projectId}/detailed-balance`);
    return data;
  }

  /**
   * Массовое обновление статуса проектов
   * @param {Object} data - Данные для обновления (ids, status_id)
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async batchUpdateStatus(data) {
    const { data: response } = await api.post("/projects/batch-status", data);
    queryCache.invalidate("projects_list");
    return response;
  }
}
