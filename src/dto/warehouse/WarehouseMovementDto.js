import { dayjsDate, dayjsDateTime } from "@/utils/dateUtils";
import WarehouseMovementProductDto from "./WarehouseMovementProductDto";

export default class WarehouseMovementDto {
    constructor(id,
        warehouseFromId,
        warehouseFromName,
        warehouseToId,
        warehouseToName,
        products = null,
        note = '',
        date = '',
        createdAt = '', updatedAt = '') {
        this.id = id;
        this.warehouseFromId = warehouseFromId;
        this.warehouseFromName = warehouseFromName;
        this.warehouseToId = warehouseToId;
        this.warehouseToName = warehouseToName;
        /** @type {Array<WarehouseMovementProductDto> | null} */
        this.products = products;
        this.note = note;
        this.date = date;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    direction(){
        return `${this.warehouseFromName} <i class="fas fa-right-long text-[#5CB85C] mr-2"></i>${this.warehouseToName}`;
    }

    productsHtmlList() {
        if (this.products === null) {
            return '';
        }
        var res = '<ul>';
        this.products.forEach(product => {
            res += `<li style="display: flex; align-items: center; gap: 10px;">`;
            if (product.productImage !== null) {
                res += `<img src="${product.imgUrl()}" alt="" width="20px" class="rounded">`;
            }
            res += `${product.productName} - ${product.quantity}${product.unitShortName}</li>`;
        });
        res += '</ul>';
        return res;
    }
    formatDate() {
        return this.date !== null ? dayjsDate(this.date) : '-';
    }
    
    formatCreatedAt() {
        return dayjsDate(this.createdAt);
    }

    formatUpdatedAt() {
        return dayjsDate(this.updatedAt);
    }
}