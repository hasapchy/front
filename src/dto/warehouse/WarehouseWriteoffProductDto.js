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
        this.stock_quantity = stockQuantity;
    }

    static fromProductDto(productDto, def = false) {
        return new WarehouseWriteoffProductDto(
            null, // id
            null,
            productDto.id,
            productDto.name,
            productDto.image,
            productDto.unit_id,
            productDto.unit_name,
            productDto.unit_short_name,
            def ? 1 : 0,
            '',
            productDto.stock_quantity || 0
        );
    }

    imgUrl() {
        return this.productImage && this.productImage.length > 0 ? `${import.meta.env.VITE_APP_BASE_URL}/storage/${this.productImage}` : null
    }
}