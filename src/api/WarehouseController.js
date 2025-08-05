import PaginatedResponse from '@/dto/app/PaginatedResponseDto';
import WarehouseDto from '@/dto/warehouse/WarehouseDto';
import api from './axiosInstance';

export default class WarehouseController {
    static async getWarehouses(page = 1) {
        try {
            const response = await api.get(`/warehouses?page=${page}`);
            const data = response.data;
            // Преобразуем полученные данные в DTO
            const items = data.items.map(item => {
                return new WarehouseDto(
                    item.id,
                    item.name,
                    item.users,
                    item.created_at,
                    item.updated_at
                );
            });

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
            // Преобразуем полученные данные в DTO
            const items = data.map(item => {
                return new WarehouseDto(
                    item.id,
                    item.name,
                    item.users,
                    item.created_at,
                    item.updated_at
                );
            });
            return items;
        } catch (error) {
            console.error('Ошибка при получении всех складов:', error);
            throw error;
        }
    }

    static async storeWarehouse(warehouse) {
        try {
            const { data } = await api.post('/warehouses', warehouse);
            return data;
        } catch (error) {
            console.error('Ошибка при создании склада:', error);
            throw error;
        }
    }

    static async updateWarehouse(id, warehouse) {
        try {
            const { data } = await api.put(`/warehouses/${id}`, warehouse);
            return data;
        } catch (error) {
            console.error('Ошибка при обновлении склада:', error);
            throw error;
        }
    }

    static async deleteWarehouse(id) {
        try {
            const { data } = await api.delete(`/warehouses/${id}`);
            return data;
        } catch (error) {
            console.error('Ошибка при удалении склада:', error);
            throw error;
        }
    }
}