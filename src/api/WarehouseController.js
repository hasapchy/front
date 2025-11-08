import PaginatedResponse from '@/dto/app/PaginatedResponseDto';
import WarehouseDto from '@/dto/warehouse/WarehouseDto';
import api from './axiosInstance';

export default class WarehouseController {
    static async getItems(page = 1, per_page = 20) {
        try {
            const response = await api.get(`/warehouses?page=${page}&per_page=${per_page}`);
            const data = response.data;
            const items = WarehouseDto.fromApiArray(data.items);

            const paginatedResponse = new PaginatedResponse(items, data.current_page, data.next_page, data.last_page, data.total);

            return paginatedResponse;
        } catch (error) {
            console.error('Ошибка при получении складов:', error);
            throw error;
        }
    }

    static async getAllItems() {
        try {
            const response = await api.get(`/warehouses/all`);
            const data = response.data;
            const items = WarehouseDto.fromApiArray(data);
            return items;
        } catch (error) {
            console.error('Ошибка при получении всех складов:', error);
            throw error;
        }
    }

    static async storeItem(item) {
        try {
            const { data } = await api.post('/warehouses', item);
            return { item: data.warehouse, message: data.message };
        } catch (error) {
            console.error('Ошибка при создании склада:', error);
            throw error;
        }
    }

    static async updateItem(id, item) {
        try {
            const { data } = await api.put(`/warehouses/${id}`, item);
            return { item: data.warehouse, message: data.message };
        } catch (error) {
            console.error('Ошибка при обновлении склада:', error);
            throw error;
        }
    }

    static async deleteItem(id) {
        try {
            const { data } = await api.delete(`/warehouses/${id}`);
            return data;
        } catch (error) {
            console.error('Ошибка при удалении склада:', error);
            throw error;
        }
    }
}