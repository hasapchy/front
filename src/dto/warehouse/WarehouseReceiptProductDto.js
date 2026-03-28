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
        price) {
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
    }

    static fromProductDto(productDto, def = false) {
        return new WarehouseReceiptProductDto(
            null,
            null,
            productDto.id,
            productDto.name,
            productDto.image,
            productDto.unitId,
            productDto.unitName,
            productDto.unitShortName,
            def ? 1 : 0,
            def ? productDto.purchasePrice :0,
        );
    }

    imgUrl() {
        return getImageUrl(this.productImage);
    }

    static fromApiArray(dataArray) {
        return createFromApiArray(dataArray, (data) => {
            return new WarehouseReceiptProductDto(
                data.id,
                data.receipt_id,
                data.product_id,
                data.product_name,
                data.product_image,
                data.unit_id,
                data.unit_name,
                data.unit_short_name,
                data.quantity,
                data.price,
            );
        }).filter(Boolean);
    }
}
