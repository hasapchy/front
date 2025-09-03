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
            null, // id
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
        return this.productImage && this.productImage.length > 0 ? `${import.meta.env.VITE_APP_BASE_URL}/storage/${this.productImage}` : null
    }
}