import api from './axiosInstance';
import PaginatedResponse from '@/dto/app/PaginatedResponseDto';
import WarehouseStockDto from '@/dto/warehouse/WarehouseStockDto';

export default class WarehouseStockController {
    static async getItems(page = 1, warehouse_id = null, category_id = null, per_page = 20, search = null, availability = 'all') {
        try {
            const response = await api.get(`/warehouse_stocks?page=${page}`, {
                params: {
                    warehouse_id: warehouse_id,
                    per_page: per_page,
                    category_id: category_id,
                    availability: availability,
                    ...(search ? { search } : {})
                }
            });
            const data = response.data;
            const items = WarehouseStockDto.fromApiArray(data.items);

            const paginatedResponse = new PaginatedResponse(items, data.current_page, data.next_page, data.last_page, data.total);

            return paginatedResponse;
        } catch (error) {
            console.error('Ошибка при получении стоков:', error);
            throw error;
        }
    }

    static async getStocks(page = 1, warehouse_id = null, category_id = null, per_page = 20, search = null, availability = 'all') {
        return this.getItems(page, warehouse_id, category_id, per_page, search, availability);
    }
}