import { dtoDateFormatters } from "@/utils/dateUtils";
import { getImageUrl, createFromApiArray } from "@/utils/dtoUtils";

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
        createdAt = '',
        isBelowMinStock = false,
        stockByUnits = []) {
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
        this.isBelowMinStock = Boolean(isBelowMinStock);
        this.stockByUnits = Array.isArray(stockByUnits) ? stockByUnits : [];
    }

    imgUrl() {
        return getImageUrl(this.productImage);
    }


    formatCreatedAt() {
        return dtoDateFormatters.formatCreatedAt(this.createdAt);
    }

    static fromApiArray(dataArray) {
        return createFromApiArray(dataArray, data => {
            return new WarehouseStockDto(
                data.id,
                data.warehouse_id,
                data.warehouse_name,
                data.product_id,
                data.product_name,
                data.product_image,
                data.unit_id,
                data.unit_name,
                data.unit_short_name,
                data.category_id,
                data.category_name,
                data.quantity,
                data.created_at,
                data.is_below_min_stock,
                data.stock_by_units
            );
        }).filter(Boolean);
    }
}