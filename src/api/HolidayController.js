import HolidayDto from '@/dto/holiday/HolidayDto';
import { CacheInvalidator } from '@/cache';
import BaseController from './BaseController';

class HolidayController extends BaseController {
    static async getItems(page = 1, perPage = 20, filters = {}) {
        const data = await super.getItems('/holidays', page, perPage, filters);
        return {
            items: HolidayDto.fromApiArray(data.items),
            currentPage: data.current_page,
            lastPage: data.last_page,
            perPage: data.per_page,
            total: data.total
        };
    }

    static async getListItems(filters = {}) {
        const data = await this.getData('/holidays/all', { params: filters });
        return HolidayDto.fromApiArray(data);
    }

    static async getAll(params = {}) {
        return this.getData('/holidays/all', { params });
    }

    static async getItem(id) {
        const data = await this.getData(`/holidays/${id}`);
        return HolidayDto.fromApi(data);
    }

    static async getById(id) {
        return this.getData(`/holidays/${id}`);
    }

    static async storeItem(data) {
        const response = await this.post('/holidays', data);
        await CacheInvalidator.onCreate('holidays', data?.companyId ?? null);
        return response;
    }

    static async create(data) {
        return this.storeItem(data);
    }

    static async updateItem(id, data) {
        const response = await this.put(`/holidays/${id}`, data);
        await CacheInvalidator.onUpdate('holidays', data?.companyId ?? null);
        return response;
    }

    static async update(id, data) {
        return this.updateItem(id, data);
    }

    static async deleteItem(id) {
        const response = await super.delete(`/holidays/${id}`);
        await CacheInvalidator.onDelete('holidays');
        return response;
    }

    static async delete(id) {
        return this.deleteItem(id);
    }
}

export default HolidayController;
