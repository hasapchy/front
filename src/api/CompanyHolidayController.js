import CompanyHolidayDto from '@/dto/companyHoliday/CompanyHolidayDto';
import BaseController from './BaseController';

class CompanyHolidayController extends BaseController {
    /**
     * Получить список праздников с пагинацией
     */
    static async getItems(page = 1, perPage = 20, filters = {}) {
        const data = await super.getItems('/company-holidays', page, perPage, filters);
        return {
            items: CompanyHolidayDto.fromApiArray(data.items),
            currentPage: data.current_page,
            lastPage: data.last_page,
            perPage: data.per_page,
            total: data.total
        };
    }

    /**
     * Получить список всех праздников (без пагинации)
     */
    static async getListItems(filters = {}) {
        const data = await this.getData('/company-holidays/all', { params: filters });
        return CompanyHolidayDto.fromApiArray(data);
    }

    /**
     * Получить все праздники (alias для совместимости)
     */
    static async getAll(params = {}) {
        return this.getData('/company-holidays/all', { params });
    }

    /**
     * Получить праздник по ID
     */
    static async getItem(id) {
        const data = await this.getData(`/company-holidays/${id}`);
        return CompanyHolidayDto.fromApi(data);
    }

    /**
     * Получить праздник по ID (alias)
     */
    static async getById(id) {
        return this.getData(`/company-holidays/${id}`);
    }

    /**
     * Создать праздник
     */
    static async storeItem(data) {
        return this.post('/company-holidays', data);
    }

    /**
     * Создать праздник (alias)
     */
    static async create(data) {
        return this.post('/company-holidays', data);
    }

    /**
     * Обновить праздник
     */
    static async updateItem(id, data) {
        return this.put(`/company-holidays/${id}`, data);
    }

    /**
     * Обновить праздник (alias)
     */
    static async update(id, data) {
        return this.put(`/company-holidays/${id}`, data);
    }

    /**
     * Удалить праздник
     */
    static async deleteItem(id) {
        return this.delete(`/company-holidays/${id}`);
    }

    /**
     * Удалить праздник (alias)
     */
    static async delete(id) {
        return this.delete(`/company-holidays/${id}`);
    }

    /**
     * Пакетное удаление праздников
     */
    static async batchDelete(ids) {
        return this.post('/company-holidays/batch-delete', { ids });
    }
}

export default CompanyHolidayController;
