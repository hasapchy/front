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
        quantity) {
        this.id = id;
        this.movementId = movementId;
        this.productId = productId;
        this.productName = productName;
        this.productImage = productImage;
        this.unitId = unitId;
        this.unitName = unitName;
        this.unitShortName = unitShortName;
        this.quantity = quantity;
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
        );
    }

    imgUrl() {
        return getImageUrl(this.productImage);
    }

    static fromApiArray(dataArray) {
        return createFromApiArray(dataArray, (data) => {
            const row = new WarehouseMovementProductDto(
                data.id,
                data.movement_id,
                data.product_id,
                data.product_name,
                data.product_image,
                data.unit_id,
                data.unit_name,
                data.unit_short_name,
                data.quantity,
            );
            row.origUnitId = data.orig_unit_id != null && data.orig_unit_id !== '' ? Number(data.orig_unit_id) : null;
            row.origQuantity = data.orig_quantity != null && data.orig_quantity !== '' ? Number(data.orig_quantity) : null;
            row.origUnitShortName = data.orig_unit_short_name != null && data.orig_unit_short_name !== ''
                ? String(data.orig_unit_short_name)
                : null;
            if (row.origUnitId != null && row.unitId != null && row.origUnitId !== row.unitId) {
                row.alternateInputUnitId = row.origUnitId;
            }
            return row;
        }).filter(Boolean);
    }
}
