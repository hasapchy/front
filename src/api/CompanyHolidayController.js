import CompanyHolidayDto from '@/dto/companyHoliday/CompanyHolidayDto';
import { CacheInvalidator } from '@/cache';
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
        const response = await this.post('/company-holidays', data);
        await CacheInvalidator.onCreate('companyHolidays', data?.companyId ?? null);
        return response;
    }

    static async create(data) {
        return this.storeItem(data);
    }

    static async updateItem(id, data) {
        const response = await this.put(`/company-holidays/${id}`, data);
        await CacheInvalidator.onUpdate('companyHolidays', data?.companyId ?? null);
        return response;
    }

    static async update(id, data) {
        return this.updateItem(id, data);
    }

    static async deleteItem(id) {
        const response = await super.delete(`/company-holidays/${id}`);
        await CacheInvalidator.onDelete('companyHolidays');
        return response;
    }

    static async delete(id) {
        return this.deleteItem(id);
    }
}

export default CompanyHolidayController;
