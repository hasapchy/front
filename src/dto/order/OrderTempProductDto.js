import { formatNumber } from "@/utils/numberUtils";

export default class OrderTempProductDto {
    constructor(data = {}) {
        this.id = data.id || null;
        this.orderId = data.order_id || null;
        this.name = data.name || '';
        this.description = data.description || '';
        this.quantity = data.quantity || 0;
        this.price = data.price || 0;
        this.unitId = data.unit_id || null;
        this.unitShortName = data.unit_short_name || '';
        this.createdAt = data.created_at || null;
        this.updatedAt = data.updated_at || null;
        this.productType = 'temp';
    }

    getTotalPrice() {
        return this.quantity * this.price;
    }

    getTotalPriceFormatted() {
        return formatNumber(this.getTotalPrice(), null, true);
    }

    getPriceFormatted() {
        return formatNumber(this.price, null, true);
    }

    getQuantityFormatted() {
        const num = Number(this.quantity);
        return isNaN(num) || !this.quantity ? '0.00' : formatNumber(this.quantity, 2, true);
    }

    static fromProductDto(product, quantity = 1, price = 0) {
        return new OrderTempProductDto({
            name: product.name,
            description: product.description || '',
            quantity: quantity,
            price: price || product.retailPrice || 0,
            unitId: product.unitId,
            unitShortName: product.unitShortName,
        });
    }

    toApiObject() {
        return {
            name: this.name,
            description: this.description,
            quantity: this.quantity,
            price: this.price,
            unit_id: this.unitId,
        };
    }

    clone() {
        return new OrderTempProductDto({
            id: this.id,
            orderId: this.orderId,
            name: this.name,
            description: this.description,
            quantity: this.quantity,
            price: this.price,
            unitId: this.unitId,
            unitShortName: this.unitShortName,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        });
    }

    icons() {
        return '<i class="fas fa-bolt text-[#EAB308]" title="временный товар"></i>';
    }
}
