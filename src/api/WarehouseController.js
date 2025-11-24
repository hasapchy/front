import BaseController from './BaseController';
import WarehouseDto from '@/dto/warehouse/WarehouseDto';

/**
 * Контроллер для работы со складами
 * @class WarehouseController
 */
export default class WarehouseController {
    /**
     * Получить список складов с пагинацией
     * @param {number} [page=1] - Номер страницы
     * @param {number} [per_page=20] - Количество элементов на странице
     * @returns {Promise<PaginatedResponse>} Объект с пагинированными данными
     */
    static async getItems(page = 1, per_page = 20) {
        return BaseController.getItems('/warehouses', WarehouseDto, page, per_page);
    }

    /**
     * Получить все склады без пагинации
     * @returns {Promise<Array<WarehouseDto>>} Массив складов
     */
    static async getAllItems() {
        return BaseController.getAllItems('/warehouses', WarehouseDto);
    }

    /**
     * Создать новый склад
     * @param {Object} item - Данные склада
     * @returns {Promise<Object>} Ответ от сервера с созданным складом
     */
    static async storeItem(item) {
        const data = await BaseController.storeItem('/warehouses', item);
        return { item: data.warehouse, message: data.message };
    }

    /**
     * Обновить склад
     * @param {number|string} id - ID склада
     * @param {Object} item - Данные склада
     * @returns {Promise<Object>} Ответ от сервера с обновленным складом
     */
    static async updateItem(id, item) {
        const data = await BaseController.updateItem('/warehouses', id, item);
        return { item: data.warehouse, message: data.message };
    }

    /**
     * Удалить склад
     * @param {number|string} id - ID склада
     * @returns {Promise<Object>} Ответ от сервера
     */
    static async deleteItem(id) {
        return BaseController.deleteItem('/warehouses', id);
    }
}