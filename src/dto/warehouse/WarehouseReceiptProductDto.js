import { getImageUrl, createFromApiArray } from "@/utils/dtoUtils";

export default class WarehouseReceiptProductDto {
    constructor(id,
        receiptId,
        productId,
        productName,
        productImage,
        unitId,
        unitName,
        unitShortName,
        quantity,
        price,
        snId) {
        this.id = id;
        this.receiptId = receiptId;
        this.productId = productId;
        this.productName = productName;
        this.productImage = productImage;
        this.unitId = unitId;
        this.unitName = unitName;
        this.unitShortName = unitShortName;
        this.quantity = quantity;
        this.price = price;
        this.snId = snId;
    }

    static fromProductDto(productDto, def = false) {
        return new WarehouseReceiptProductDto(
            null,
            null,
            productDto.id,
            productDto.name,
            productDto.image,
            productDto.unit_id,
            productDto.unit_name,
            productDto.unit_short_name,
            def ? 1 : 0,
            def ? productDto.purchase_price :0,
            ''
        );
    }

    imgUrl() {
        return getImageUrl(this.productImage);
    }

    static fromApiArray(dataArray) {
        return createFromApiArray(dataArray, data => {
            const product = data.product || {};
            const unit = product.unit || {};
            return new WarehouseReceiptProductDto(
                data.id,
                data.receipt_id,
                data.product_id,
                data.product_name || product.name,
                data.product_image || product.image,
                data.unit_id || product.unit_id,
                data.unit_name || unit.name,
                data.unit_short_name || unit.short_name,
                data.quantity,
                data.price,
                data.sn_id
            );
        }).filter(Boolean);
    }
}