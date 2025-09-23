export default class SaleProductDto {
    constructor(id,
        saleId,
        productId,
        productName,
        productImage,
        unitId,
        unitName,
        unitShortName,
        quantity,
        price) {
        this.id = id;
        this.saleId = saleId;
        this.productId = productId;
        this.productName = productName;
        this.productImage = productImage;
        this.unitId = unitId;
        this.unitName = unitName;
        this.unitShortName = unitShortName;
        this.quantity = quantity;
        this.price = price;
        this.type = null; // 1=товар, 0=услуга (заполняется при наличии)
    }

    static fromProductDto(productDto, def = false) {
        const dto = new SaleProductDto(
            null, // id
            null,
            productDto.id,
            productDto.name,
            productDto.image,
            productDto.unit_id,
            productDto.unit_name,
            productDto.unit_short_name,
            def ? 1 : 0,
            def ? productDto.sale_price :0,
        );
        dto.type = productDto.type;
        return dto;
    }

    imgUrl() {
        if (!this.productImage) return null;
        if (typeof this.productImage !== 'string') return null;
        return this.productImage.length > 0 ? `${import.meta.env.VITE_APP_BASE_URL}/storage/${this.productImage}` : null;
    }

    icons() {
        const isProduct = this.type == 1 || this.type === '1' || this.type === true;
        return isProduct
            ? '<i class="fas fa-box text-[#3571A4]" title="Товар"></i>'
            : '<i class="fas fa-concierge-bell text-[#3571A4]" title="Услуга"></i>';
    }
}