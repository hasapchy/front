import api from './axiosInstance';
import CompanyHolidayDto from '@/dto/companyHoliday/CompanyHolidayDto';

class CompanyHolidayController {
    /**
     * Получить список праздников с пагинацией
     */
    static async getItems(page = 1, per_page = 10, filters = {}) {
        const params = { page, per_page, ...filters };
        const response = await api.get('/company-holidays', { params });
        
        return {
            items: CompanyHolidayDto.fromArray(response.data.data || []),
            currentPage: response.data.current_page || page,
            lastPage: response.data.last_page || 1,
            perPage: response.data.per_page || per_page,
            total: response.data.total || 0
        };
    }

    /**
     * Получить список всех праздников (без пагинации)
     */
    static async getListItems(filters = {}) {
        const response = await api.get('/company-holidays/all', { params: filters });
        return CompanyHolidayDto.fromArray(response.data || []);
    }

    /**
     * Получить все праздники (alias для совместимости)
     */
    static async getAll(params = {}) {
        const response = await api.get('/company-holidays/all', { params });
        return response.data;
    }

    /**
     * Получить праздник по ID
     */
    static async getItem(id) {
        const response = await api.get(`/company-holidays/${id}`);
        return new CompanyHolidayDto(response.data.item);
    }

    /**
     * Получить праздник по ID (alias)
     */
    static async getById(id) {
        const response = await api.get(`/company-holidays/${id}`);
        return response.data.item;
    }

    /**
     * Создать праздник
     */
    static async storeItem(data) {
        const response = await api.post('/company-holidays', data);
        return response.data;
    }

    /**
     * Создать праздник (alias)
     */
    static async create(data) {
        const response = await api.post('/company-holidays', data);
        return response.data;
    }

    /**
     * Обновить праздник
     */
    static async updateItem(id, data) {
        const response = await api.put(`/company-holidays/${id}`, data);
        return response.data;
    }

    /**
     * Обновить праздник (alias)
     */
    static async update(id, data) {
        const response = await api.put(`/company-holidays/${id}`, data);
        return response.data;
    }

    /**
     * Удалить праздник
     */
    static async deleteItem(id) {
        const response = await api.delete(`/company-holidays/${id}`);
        return response.data;
    }

    /**
     * Удалить праздник (alias)
     */
    static async delete(id) {
        const response = await api.delete(`/company-holidays/${id}`);
        return response.data;
    }

    /**
     * Пакетное удаление праздников
     */
    static async batchDelete(ids) {
        const response = await api.post('/company-holidays/batch-delete', { ids });
        return response.data;
    }
}

export default CompanyHolidayController;
