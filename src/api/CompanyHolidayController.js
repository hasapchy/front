import CompanyHolidayDto from '@/dto/companyHoliday/CompanyHolidayDto';
import BaseController from './BaseController';

class CompanyHolidayController extends BaseController {
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

    static async getListItems(filters = {}) {
        const data = await this.getData('/company-holidays/all', { params: filters });
        return CompanyHolidayDto.fromApiArray(data);
    }

    static async getAll(params = {}) {
        return this.getData('/company-holidays/all', { params });
    }

    static async getItem(id) {
        const data = await this.getData(`/company-holidays/${id}`);
        return CompanyHolidayDto.fromApi(data);
    }

    static async getById(id) {
        return this.getData(`/company-holidays/${id}`);
    }

    static async storeItem(data) {
        return this.post('/company-holidays', data);
    }

    static async create(data) {
        return this.post('/company-holidays', data);
    }

    static async updateItem(id, data) {
        return this.put(`/company-holidays/${id}`, data);
    }

    static async update(id, data) {
        return this.put(`/company-holidays/${id}`, data);
    }

    static async deleteItem(id) {
        return super.delete(`/company-holidays/${id}`);
    }

    static async delete(id) {
        return super.delete(`/company-holidays/${id}`);
    }

    static async batchDelete(ids) {
        return this.post('/company-holidays/batch-delete', { ids });
    }
}

export default CompanyHolidayController;
