import { formatNumber } from "@/utils/numberUtils";

/**
 * DTO для временного товара в заказе (товар, не существующий в каталоге)
 * @class OrderTempProductDto
 */
export default class OrderTempProductDto {
    /**
     * Создает экземпляр OrderTempProductDto
     * @param {Object} data - Данные временного товара
     * @param {number|null} data.id - ID временного товара
     * @param {number|null} data.order_id - ID заказа
     * @param {string} data.name - Название товара
     * @param {string} data.description - Описание товара
     * @param {number} data.quantity - Количество
     * @param {number} data.price - Цена за единицу
     * @param {number|null} data.unit_id - ID единицы измерения
     * @param {string} data.unit_name - Название единицы измерения
     * @param {string} data.unit_short_name - Короткое название единицы измерения
     * @param {number|null} data.width - Ширина (для расчета площади/периметра)
     * @param {number|null} data.height - Высота (для расчета площади/периметра)
     * @param {string|null} data.created_at - Дата создания
     * @param {string|null} data.updated_at - Дата обновления
     */
    constructor(data = {}) {
        this.id = data.id || null;
        this.orderId = data.order_id || null;
        this.name = data.name || '';
        this.description = data.description || '';
        this.quantity = data.quantity || 0;
        this.price = data.price || 0;
        this.unitId = data.unit_id || null;
        this.unitName = data.unit_name || '';
        this.unitShortName = data.unit_short_name || '';
        this.width = data.width || null;
        this.height = data.height || null;
        this.createdAt = data.created_at || null;
        this.updatedAt = data.updated_at || null;
        this.productType = 'temp';
    }

    /**
     * Вычислить общую стоимость товара
     * @returns {number} Общая стоимость (количество * цена)
     */
    getTotalPrice() {
        return this.quantity * this.price;
    }

    /**
     * Получить отформатированную общую стоимость
     * @returns {string} Отформатированная общая стоимость
     */
    getTotalPriceFormatted() {
        return formatNumber(this.getTotalPrice(), null, true);
    }

    /**
     * Получить отформатированную цену за единицу
     * @returns {string} Отформатированная цена
     */
    getPriceFormatted() {
        return formatNumber(this.price, null, true);
    }

    /**
     * Получить отформатированное количество
     * @returns {string} Отформатированное количество
     */
    getQuantityFormatted() {
        const num = Number(this.quantity);
        return isNaN(num) || !this.quantity ? '0.00' : formatNumber(this.quantity, 2, true);
    }

    /**
     * Создает экземпляр OrderTempProductDto из ProductDto
     * @param {Object} product - Объект ProductDto
     * @param {number} quantity - Количество (по умолчанию 1)
     * @param {number} price - Цена (по умолчанию 0 или retailPrice из продукта)
     * @returns {OrderTempProductDto} Экземпляр OrderTempProductDto
     */
    static fromProductDto(product, quantity = 1, price = 0) {
        return new OrderTempProductDto({
            name: product.name,
            description: product.description || '',
            quantity: quantity,
            price: price || product.retailPrice || 0,
            unitId: product.unitId,
            unitName: product.unitName,
            unitShortName: product.unitShortName,
        });
    }

    /**
     * Преобразует DTO в объект для отправки на API
     * @returns {Object} Объект с полями в формате snake_case
     */
    toApiObject() {
        return {
            name: this.name,
            description: this.description,
            quantity: this.quantity,
            price: this.price,
            unit_id: this.unitId,
            width: this.width,
            height: this.height,
        };
    }

    /**
     * Создает копию текущего экземпляра
     * @returns {OrderTempProductDto} Новый экземпляр OrderTempProductDto с теми же данными
     */
    clone() {
        return new OrderTempProductDto({
            id: this.id,
            orderId: this.orderId,
            name: this.name,
            description: this.description,
            quantity: this.quantity,
            price: this.price,
            unitId: this.unitId,
            unitName: this.unitName,
            unitShortName: this.unitShortName,
            width: this.width,
            height: this.height,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        });
    }

    /**
     * Получить HTML иконку для временного товара
     * @returns {string} HTML строка с иконкой
     */
    icons() {
        return '<i class="fas fa-bolt text-[#EAB308]" title="временный товар"></i>';
    }

    /**
     * Создает массив экземпляров OrderTempProductDto из массива данных API
     * @param {Array} dataArray - Массив объектов временных товаров из API
     * @returns {Array<OrderTempProductDto>} Массив экземпляров OrderTempProductDto
     */
    static fromApiArray(dataArray) {
        if (!Array.isArray(dataArray)) return [];
        return dataArray.map(data => new OrderTempProductDto({
            id: data.id,
            order_id: data.order_id,
            name: data.name,
            description: data.description,
            quantity: data.quantity,
            price: data.price,
            unit_id: data.unit_id,
            unit_name: data.unit_name,
            unit_short_name: data.unit_short_name,
            width: data.width,
            height: data.height,
            created_at: data.created_at,
            updated_at: data.updated_at
        }));
    }
}
