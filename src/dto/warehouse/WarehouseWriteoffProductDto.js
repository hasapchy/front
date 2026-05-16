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
        stockQuantity,
        price = 0,
        sourceReceiptProductId = null) {
        this.id = id;
        this.writeOffId = writeOffId;
        this.productId = productId;
        this.productName = productName;
        this.productImage = productImage;
        this.unitId = unitId;
        this.unitName = unitName;
        this.unitShortName = unitShortName;
        this.quantity = quantity;
        this.stockQuantity = stockQuantity;
        this.price = price;
        this.sourceReceiptProductId = sourceReceiptProductId;
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
                productDto.stockQuantity ?? 0,
                productDto.purchasePrice ?? 0,
                null
        );
    }

    imgUrl() {
        return getImageUrl(this.productImage);
    }

    static fromApiArray(dataArray) {
        return createFromApiArray(dataArray, (data) => {
            const row = new WarehouseWriteoffProductDto(
                data.id,
                data.writeoff_id ?? data.write_off_id ?? null,
                data.product_id,
                data.product_name,
                data.product_image,
                data.unit_id,
                data.unit_name,
                data.unit_short_name,
                data.quantity,
                data.stock_quantity,
                data.price ?? 0,
                data.source_receipt_product_id ?? null,
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
