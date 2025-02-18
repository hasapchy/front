import PaginatedResponse from '@/dto/app/PaginatedResponseDto';
import CategoryDto from '@/dto/category/CategoryDto';
import api from './axiosInstance';

export default class CategoryController {
    static async getItems(page = 1) {
        try {
            const response = await api.get(`/categories?page=${page}`);
            const data = response.data;
            console.log(data);
            // Преобразуем полученные данные в DTO
            const items = data.items.map(item => {
                return new CategoryDto(
                    item.id,
                    item.name,
                    item.parent_id,
                    item.parent_name,
                    item.user_id,
                    item.user_name,
                    item.users,
                    item.created_at,
                    item.updated_at,
                );
            });

            const paginatedResponse = new PaginatedResponse(items, data.current_page, data.next_page, data.last_page, data.total);

            return paginatedResponse;
        } catch (error) {
            console.error('Ошибка при получении категорий:', error);
            throw error;
        }
    }

    static async getAllItems() {
        try {
            const response = await api.get(`/categories/all`);
            const data = response.data;
            console.log(data);
            // Преобразуем полученные данные в DTO
            const items = data.map(item => {
                return new CategoryDto(
                    item.id,
                    item.name,
                    item.parent_id,
                    item.parent_name,
                    item.user_id,
                    item.user_name,
                    item.users,
                    item.created_at,
                    item.updated_at,
                );
            });
            return items;
        } catch (error) {
            console.error('Ошибка при получении категорий:', error);
            throw error;
        }
    }

    static async storeItem(item) {
        try {
            const { data } = await api.post('/categories', item);
            return data;
        } catch (error) {
            console.error('Ошибка при создании категории:', error);
            throw error;
        }
    }

    static async updateItem(id, item) {
        try {
            const { data } = await api.put(`/categories/${id}`, item);
            return data;
        } catch (error) {
            console.error('Ошибка при обновлении категории:', error);
            throw error;
        }
    }

    static async deleteItem(id) {
        try {
            const { data } = await api.delete(`/categories/${id}`);
            return data;
        } catch (error) {
            console.error('Ошибка при удалении категории:', error);
            throw error;
        }
    }
}