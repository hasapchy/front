import BaseController from './BaseController';
import api from './axiosInstance';
import ProjectContractDto from '../dto/project/ProjectContractDto';

/**
 * Контроллер для работы с контрактами проектов
 * @class ProjectContractController
 */
export default class ProjectContractController {
    /**
     * Получить список контрактов проекта
     * @param {number|string} projectId - ID проекта
     * @param {Object} [params={}] - Дополнительные параметры
     * @returns {Promise<PaginatedResponse>} Объект с пагинированными данными
     */
    static async getItems(projectId, params = {}) {
        return BaseController.getItems(`/projects/${projectId}/contracts`, ProjectContractDto, params.page || 1, params.per_page || 20, params);
    }

    /**
     * Получить все контракты проекта без пагинации
     * @param {number|string} projectId - ID проекта
     * @returns {Promise<Array<ProjectContractDto>>} Массив контрактов
     */
    static async getAllItems(projectId) {
        return BaseController.getAllItems(`/projects/${projectId}/contracts`, ProjectContractDto);
    }

    /**
     * Получить контракт по ID
     * @param {number|string} id - ID контракта
     * @returns {Promise<ProjectContractDto|null>} Контракт или null
     */
    static async getItem(id) {
        return BaseController.getItem('/contracts', ProjectContractDto, id);
    }

    /**
     * Создать новый контракт проекта
     * @param {number|string} projectId - ID проекта
     * @param {Object} item - Данные контракта
     * @returns {Promise<Object>} Ответ от сервера с созданным контрактом
     */
    static async storeItem(projectId, item) {
        const contractData = {
            ...item,
            projectId: projectId,
            id: null
        };
        const contractDto = ProjectContractDto.fromApiArray([contractData])[0];

        const response = await api.post(`/projects/${projectId}/contracts`, contractDto.toApi());
        const items = ProjectContractDto.fromApiArray([response.data]);
        return {
            item: items[0] || null,
            message: response.data.message || null
        };
    }

    /**
     * Обновить контракт
     * @param {number|string} id - ID контракта
     * @param {Object} item - Данные контракта
     * @returns {Promise<Object>} Ответ от сервера с обновленным контрактом
     */
    static async updateItem(id, item) {
        const contractData = {
            ...item,
            id: id
        };
        const contractDto = ProjectContractDto.fromApiArray([contractData])[0];

        const response = await api.put(`/contracts/${id}`, contractDto.toApi());
        const items = ProjectContractDto.fromApiArray([response.data]);
        return {
            item: items[0] || null,
            message: response.data.message || null
        };
    }

    /**
     * Удалить контракт
     * @param {number|string} id - ID контракта
     * @returns {Promise<Object>} Ответ от сервера
     */
    static async deleteItem(id) {
        return BaseController.deleteItem('/contracts', id);
    }
}
