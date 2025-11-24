import BaseController from "./BaseController";
import UserDto from "@/dto/users/UserDto";
import api from "./axiosInstance";
import { createFormData } from "@/utils/formDataHelper";

/**
 * Контроллер для работы с пользователями
 * @class UsersController
 */
export default class UsersController {
  /**
   * Получить список пользователей с пагинацией
   * @param {number} [page=1] - Номер страницы
   * @param {number} [per_page=20] - Количество элементов на странице
   * @returns {Promise<PaginatedResponse>} Объект с пагинированными данными
   */
  static async getItems(page = 1, per_page = 20) {
    return BaseController.getItems('/users', UserDto, page, per_page);
  }

  /**
   * Получить всех пользователей без пагинации
   * @returns {Promise<Array<UserDto>>} Массив пользователей
   */
  static async getAllItems() {
    return BaseController.getAllItems('/users', UserDto);
  }

  /**
   * Создать нового пользователя
   * @param {Object} payload - Данные пользователя
   * @param {File|null} [file=null] - Файл фотографии
   * @param {Object} [options={}] - Дополнительные опции (cancelToken, onProgress, timeout)
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async storeItem(payload, file = null, options = {}) {
    const { requestData, headers } = this._prepareRequestData(payload, file);
    const { data } = await api.post("/users", requestData, {
      headers,
      cancelToken: options.cancelToken,
      onUploadProgress: file ? options.onProgress : undefined,
      timeout: file ? (options.timeout || 60000) : undefined,
    });
    return data;
  }

  /**
   * Обновить пользователя
   * @param {number|string} id - ID пользователя
   * @param {Object} payload - Данные пользователя
   * @param {File|null} [file=null] - Файл фотографии
   * @param {Object} [options={}] - Дополнительные опции (cancelToken, onProgress, timeout)
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async updateItem(id, payload, file = null, options = {}) {
    const { requestData, headers } = this._prepareRequestData(payload, file);
    const { data } = await api.put(`/users/${id}`, requestData, {
      headers,
      cancelToken: options.cancelToken,
      onUploadProgress: file ? options.onProgress : undefined,
      timeout: file ? (options.timeout || 60000) : undefined,
    });
    return data;
  }

  /**
   * Удалить пользователя
   * @param {number|string} id - ID пользователя
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async deleteItem(id) {
    const { data } = await api.delete(`/users/${id}`);
    return data;
  }

  /**
   * Получить все разрешения
   * @returns {Promise<Array>} Массив разрешений
   */
  static async getAllPermissions() {
    const { data } = await api.get(`/permissions`);
    return data;
  }

  /**
   * Получить текущего пользователя
   * @returns {Promise<Object>} Данные текущего пользователя
   */
  static async getCurrentUser() {
    const { data } = await api.get(`/user/current`);
    return data;
  }

  /**
   * Обновить профиль текущего пользователя
   * @param {Object} payload - Данные профиля
   * @param {File|null} [file=null] - Файл фотографии
   * @param {Object} [options={}] - Дополнительные опции (cancelToken, onProgress, timeout)
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async updateProfile(payload, file = null, options = {}) {
    const formData = createFormData(payload, {
      file,
      fileKey: 'photo'
    });

    const { data } = await api.post(`/user/profile`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      cancelToken: options.cancelToken,
      onUploadProgress: file ? options.onProgress : undefined,
      timeout: file ? (options.timeout || 60000) : undefined,
    });
    return data;
  }

  /**
   * Получить зарплаты пользователя
   * @param {number|string} userId - ID пользователя
   * @returns {Promise<Array>} Массив зарплат
   */
  static async getSalaries(userId) {
    const { data } = await api.get(`/users/${userId}/salaries`);
    return data.salaries || [];
  }

  /**
   * Создать зарплату для пользователя
   * @param {number|string} userId - ID пользователя
   * @param {Object} salaryData - Данные зарплаты
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async createSalary(userId, salaryData) {
    const { data } = await api.post(`/users/${userId}/salaries`, salaryData);
    return data;
  }

  /**
   * Обновить зарплату пользователя
   * @param {number|string} userId - ID пользователя
   * @param {number|string} salaryId - ID зарплаты
   * @param {Object} salaryData - Данные зарплаты
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async updateSalary(userId, salaryId, salaryData) {
    const { data } = await api.put(`/users/${userId}/salaries/${salaryId}`, salaryData);
    return data;
  }

  /**
   * Удалить зарплату пользователя
   * @param {number|string} userId - ID пользователя
   * @param {number|string} salaryId - ID зарплаты
   * @returns {Promise<Object>} Ответ от сервера
   */
  static async deleteSalary(userId, salaryId) {
    const { data } = await api.delete(`/users/${userId}/salaries/${salaryId}`);
    return data;
  }

  /**
   * Получить баланс сотрудника
   * @param {number|string} userId - ID пользователя
   * @returns {Promise<number>} Баланс сотрудника
   */
  static async getEmployeeBalance(userId) {
    const { data } = await api.get(`/users/${userId}/balance`);
    return data.balance;
  }

  /**
   * Получить историю баланса сотрудника
   * @param {number|string} userId - ID пользователя
   * @returns {Promise<Array>} История баланса
   */
  static async getEmployeeBalanceHistory(userId) {
    const { data } = await api.get(`/users/${userId}/balance-history`);
    const ClientBalanceHistoryDto = (await import("@/dto/client/ClientBalanceHistoryDto")).default;
    return ClientBalanceHistoryDto.fromApiArray(data.history || []);
  }

  /**
   * Подготовить данные запроса (FormData или JSON)
   * @private
   * @param {Object} payload - Данные для отправки
   * @param {File|null} file - Файл для загрузки
   * @returns {Object} Объект с requestData и headers
   */
  static _prepareRequestData(payload, file) {
    if (file) {
      const arrayFields = Object.keys(payload).filter(key => Array.isArray(payload[key]));
      const formData = createFormData(payload, {
        file,
        fileKey: 'photo',
        arrayFields
      });
      return {
        requestData: formData,
        headers: { "Content-Type": "multipart/form-data" }
      };
    }
    return {
      requestData: payload,
      headers: { "Content-Type": "application/json" }
    };
  }
}
