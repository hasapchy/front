import { dayjsDate } from "@/utils/dateUtils";

export default class WarehouseStockDto {
    constructor(id,
        warehouseId,
        warehouseName,
        productId,
        productName,
        productImage,
        unitId,
        unitName,
        unitShortName,
        categoryId,
        categoryName,
        quantity,
        createdAt = '') {
        this.id = id;
        this.warehouseId = warehouseId;
        this.warehouseName = warehouseName;
        this.productId = productId;
        this.productName = productName;
        this.productImage = productImage;
        this.unitId = unitId;
        this.unitName = unitName;
        this.unitShortName = unitShortName;
        this.categoryId = categoryId;
        this.categoryName = categoryName;
        this.quantity = quantity;
        this.createdAt = createdAt;
    }

    imgUrl() {
        return this.productImage.length > 0 ? `${import.meta.env.VITE_APP_BASE_URL}/storage/${this.productImage}` : null
    }


    formatCreatedAt() {
        return dayjsDate(this.createdAt);
    }
}