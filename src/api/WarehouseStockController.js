import api from './axiosInstance';
import PaginatedResponse from '@/dto/app/PaginatedResponseDto';
import WarehouseStockDto from '@/dto/warehouse/WarehouseStockDto';

export default class WarehouseStockController {
    static async getStocks(page = 1, warehouse_id = null, category_id = null) {
        try {
            const response = await api.get(`/warehouse_stocks?page=${page}`, {
                params: {
                    warehouse_id: warehouse_id
                    // category_id больше не поддерживается
                }
            });
            const data = response.data;
            // Преобразуем полученные данные в DTO
            const items = data.items.map(item => {
                return new WarehouseStockDto(
                    item.id,
                    item.warehouse_id,
                    item.warehouse_name,
                    item.product_id,
                    item.product_name,
                    item.product_image,
                    item.unit_id,
                    item.unit_name,
                    item.unit_short_name,
                    null, // category_id больше не доступен
                    null, // category_name больше не доступен
                    item.quantity,
                    item.created_at
                );
            });

            const paginatedResponse = new PaginatedResponse(items, data.current_page, data.next_page, data.last_page, data.total);

            return paginatedResponse;
        } catch (error) {
            console.error('Ошибка при получении стоков:', error);
            throw error;
        }
    }

    // static async storeWarehouse(warehouse) {
    //     try {
    //         const { data } = await api.post('/warehouses', warehouse);
    //         return data;
    //     } catch (error) {
    //         console.error('Ошибка при создании склада:', error);
    //         throw error;
    //     }
    // }

    // static async updateWarehouse(id, warehouse){
    //     try {
    //         const { data } = await api.put(`/warehouses/${id}`, warehouse);
    //         return data;
    //     } catch (error) {
    //         console.error('Ошибка при обновлении склада:', error);
    //         throw error;
    //     }
    // }

    // static async deleteWarehouse(id){
    //     try {
    //         const { data } = await api.delete(`/warehouses/${id}`);
    //         return data;
    //     } catch (error) {
    //         console.error('Ошибка при удалении склада:', error);
    //         throw error;
    //     }
    // }
}