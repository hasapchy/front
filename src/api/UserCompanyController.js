import api from './axiosInstance';

class UserCompanyController {
    async getCurrentCompany() {
        try {
            const response = await api.get('/user/current-company');
            return response.data;
        } catch (error) {
            console.error('Ошибка при получении текущей компании:', error);
            throw error;
        }
    }

    async setCurrentCompany(companyId) {
        try {
            const response = await api.post('/user/set-company', { company_id: companyId });
            return response.data;
        } catch (error) {
            console.error('Ошибка при установке компании:', error);
            throw error;
        }
    }

    async getUserCompanies() {
        try {
            const response = await api.get('/user/companies');
            return response.data;
        } catch (error) {
            console.error('Ошибка при получении компаний пользователя:', error);
            throw error;
        }
    }
}

export default new UserCompanyController();
