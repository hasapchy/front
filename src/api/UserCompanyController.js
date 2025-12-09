import api from './axiosInstance';
import BaseController from './BaseController';

export default class UserCompanyController extends BaseController {
    static async getCurrentCompany() {
        return super.handleRequest(
            async () => {
                const response = await api.get('/user/current-company');
                return response.data;
            },
            'Ошибка при получении текущей компании:'
        );
    }

    static async setCurrentCompany(companyId) {
        return super.handleRequest(
            async () => {
                const response = await api.post('/user/set-company', { company_id: companyId });
                return response.data;
            },
            'Ошибка при установке компании:'
        );
    }

    static async getUserCompanies() {
        return super.handleRequest(
            async () => {
                const response = await api.get('/user/companies');
                return response.data;
            },
            'Ошибка при получении компаний пользователя:'
        );
    }
}
