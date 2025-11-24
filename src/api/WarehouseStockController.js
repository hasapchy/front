import BaseController from './BaseController';
import WarehouseStockDto from '@/dto/warehouse/WarehouseStockDto';

/**
 * Контроллер для работы со складскими остатками
 * @class WarehouseStockController
 */
export default class WarehouseStockController {
    /**
     * Получить список складских остатков с пагинацией
     * @param {number} [page=1] - Номер страницы
     * @param {number|null} [warehouse_id=null] - ID склада
     * @param {number|null} [category_id=null] - ID категории
     * @param {number} [per_page=20] - Количество элементов на странице
     * @param {string|null} [search=null] - Поисковый запрос
     * @param {string} [availability='all'] - Фильтр по наличию
     * @returns {Promise<PaginatedResponse>} Объект с пагинированными данными
     */
    static async getItems(page = 1, warehouse_id = null, category_id = null, per_page = 20, search = null, availability = 'all') {
        const params = {
            warehouse_id,
            category_id,
            availability,
            ...(search && { search })
        };
        
        return BaseController.getItems('/warehouse_stocks', WarehouseStockDto, page, per_page, params);
    }
}