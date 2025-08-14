export default class OrderTempProductDto {
    constructor(data = {}) {
        this.id = data.id || null;
        this.orderId = data.order_id || data.orderId || null;
        this.name = data.name || '';
        this.description = data.description || '';
        this.quantity = data.quantity || 0;
        this.price = data.price || 0;
        this.unitId = data.unit_id || data.unitId || null;
        this.unitName = data.unit_name || data.unitName || '';
        this.unitShortName = data.unit_short_name || data.unitShortName || '';
        this.createdAt = data.created_at || data.createdAt || null;
        this.updatedAt = data.updated_at || data.updatedAt || null;
        this.productType = 'temp'; // Для различения от обычных товаров
    }

    // Методы для работы с данными
    getTotalPrice() {
        return this.quantity * this.price;
    }

    getTotalPriceFormatted() {
        return this.getTotalPrice().toFixed(2);
    }

    getPriceFormatted() {
        return this.price.toFixed(2);
    }

    getQuantityFormatted() {
        return this.quantity.toFixed(2);
    }

    // Метод для создания DTO из обычного объекта товара
    static fromProductDto(product, quantity = 1, price = 0) {
        return new OrderTempProductDto({
            name: product.name,
            description: product.description || '',
            quantity: quantity,
            price: price || product.retail_price || 0,
            unitId: product.unit_id,
            unitName: product.unit_name,
            unitShortName: product.unit_short_name,
        });
    }

    // Метод для преобразования в объект для API
    toApiObject() {
        return {
            name: this.name,
            description: this.description,
            quantity: this.quantity,
            price: this.price,
            unit_id: this.unitId,
        };
    }

    // Метод для клонирования
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
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        });
    }

    // Иконка для отображения в заказе
    icons() {
        return '<i class="fas fa-bolt text-[#EAB308]" title="временный товар"></i>';
    }
}
