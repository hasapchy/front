import { getImageUrl, createFromApiArray } from "@/utils/dtoUtils";

export default class WarehouseWriteoffProductDto {
    constructor(id,
        writeOffId,
        productId,
        productName,
        productImage,
        unitId,
        unitName,
        unitShortName,
        quantity,
        snId,
        stockQuantity) {
        this.id = id;
        this.writeOffId = writeOffId;
        this.productId = productId;
        this.productName = productName;
        this.productImage = productImage;
        this.unitId = unitId;
        this.unitName = unitName;
        this.unitShortName = unitShortName;
        this.quantity = quantity;
        this.snId = snId;
        this.stockQuantity = stockQuantity;
    }

    static fromProductDto(productDto, def = false) {
        return new WarehouseWriteoffProductDto(
            null,
            null,
            productDto.id,
            productDto.name,
            productDto.image,
            productDto.unitId,
            productDto.unitName,
            productDto.unitShortName,
            def ? 1 : 0,
            '',
            productDto.stockQuantity || 0
        );
    }

    imgUrl() {
        return getImageUrl(this.productImage);
    }

    static fromApiArray(dataArray) {
        return createFromApiArray(dataArray, data => {
            return new WarehouseWriteoffProductDto(
                data.id,
                data.writeoff_id,
                data.product_id,
                data.product_name,
                data.product_image,
                data.unit_id,
                data.unit_name,
                data.unit_short_name,
                data.quantity,
                data.sn_id,
                data.stock_quantity
            );
        }).filter(Boolean);
    }
}