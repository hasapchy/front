import BaseController from "./BaseController";
import CompanyDto from "@/dto/companies/CompanyDto";
import api from "./axiosInstance";
import { createFormData } from "@/utils/formDataHelper";

/**
 * Контроллер для работы с компаниями
 * @class CompaniesController
 */
export default class CompaniesController {
  /**
   * Получить список компаний с пагинацией
   * @param {number} [page=1] - Номер страницы
   * @param {number} [per_page=20] - Количество элементов на странице
   * @returns {Promise<PaginatedResponse>} Объект с пагинированными данными
   */
  static async getItems(page = 1, per_page = 20) {
    return BaseController.getItems('/companies', CompanyDto, page, per_page);
  }

  /**
   * Создать новую компанию
   * @param {Object} item - Данные компании
   * @param {File|null} [logoFile=null] - Файл логотипа
   * @param {Object} [options={}] - Дополнительные опции (cancelToken, onProgress, timeout)
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async storeItem(item, logoFile, options = {}) {
    const formData = this._buildFormData(item, logoFile);
    const { data } = await api.post("/companies", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      cancelToken: options.cancelToken,
      onUploadProgress: logoFile ? options.onProgress : undefined,
      timeout: logoFile ? (options.timeout || 60000) : undefined,
    });
    return data;
  }

  /**
   * Обновить компанию
   * @param {number|string} id - ID компании
   * @param {Object} item - Данные компании
   * @param {File|null} [logoFile=null] - Файл логотипа
   * @param {Object} [options={}] - Дополнительные опции (cancelToken, onProgress, timeout)
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async updateItem(id, item, logoFile, options = {}) {
    const formData = this._buildFormData(item, logoFile);
    const { data } = await api.post(`/companies/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      cancelToken: options.cancelToken,
      onUploadProgress: logoFile ? options.onProgress : undefined,
      timeout: logoFile ? (options.timeout || 60000) : undefined,
    });
    return data;
  }

  /**
   * Удалить компанию
   * @param {number|string} id - ID компании
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async deleteItem(id) {
    const { data } = await api.delete(`/companies/${id}`);
    return data;
  }

  /**
   * Построить FormData из данных компании
   * @private
   * @param {Object} item - Данные компании
   * @param {File|null} logoFile - Файл логотипа
   * @returns {FormData} FormData объект
   */
  static _buildFormData(item, logoFile) {
    const booleanFields = ['show_deleted_transactions', 'rounding_enabled', 'rounding_quantity_enabled', 'skip_project_order_balance'];
    return createFormData(item, {
      file: logoFile,
      fileKey: 'logo',
      booleanFields
    });
  }
}
