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
            null, // id
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
        return this.productImage.length > 0 ? `${import.meta.env.VITE_APP_BASE_URL}/storage/${this.productImage}` : null
    }
}