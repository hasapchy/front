import { getImageUrl, createFromApiArray } from "@/utils/dtoUtils";

export default class WarehouseMovementProductDto {
    constructor(id,
        movementId,
        productId,
        productName,
        productImage,
        unitId,
        unitName,
        unitShortName,
        quantity,
        snId) {
        this.id = id;
        this.movementId = movementId;
        this.productId = productId;
        this.productName = productName;
        this.productImage = productImage;
        this.unitId = unitId;
        this.unitName = unitName;
        this.unitShortName = unitShortName;
        this.quantity = quantity;
        this.snId = snId;
    }

    static fromProductDto(productDto, def = false) {
        return new WarehouseMovementProductDto(
            null,
            null,
            productDto.id,
            productDto.name,
            productDto.image,
            productDto.unit_id,
            productDto.unit_name,
            productDto.unit_short_name,
            def ? 1 : 0,
            ''
        );
    }

    imgUrl() {
        return getImageUrl(this.productImage);
    }

    static fromApiArray(dataArray) {
        return createFromApiArray(dataArray, data => {
            return new WarehouseMovementProductDto(
                data.id,
                data.movement_id,
                data.product_id,
                data.product_name,
                data.product_image,
                data.unit_id,
                data.unit_name,
                data.unit_short_name,
                data.quantity,
                data.sn_id
            );
        }).filter(Boolean);
    }
}