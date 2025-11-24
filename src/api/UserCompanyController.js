import api from './axiosInstance';

/**
 * Контроллер для работы с компаниями пользователя
 * @class UserCompanyController
 */
export default class UserCompanyController {
    /**
     * Получить текущую компанию пользователя
     * @returns {Promise<Object>} Данные текущей компании
     */
    static async getCurrentCompany() {
        const response = await api.get('/user/current-company');
        return response.data;
    }

    /**
     * Установить текущую компанию пользователя
     * @param {number|string} companyId - ID компании
     * @returns {Promise<Object>} Ответ от сервера
     */
    static async setCurrentCompany(companyId) {
        const response = await api.post('/user/set-company', { company_id: companyId });
        return response.data;
    }

    /**
     * Получить список компаний пользователя
     * @returns {Promise<Array>} Массив компаний пользователя
     */
    static async getUserCompanies() {
        const response = await api.get('/user/companies');
        return response.data;
    }
}
