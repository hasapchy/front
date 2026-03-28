import { getImageUrl, createFromApiArray } from "@/utils/dtoUtils";

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
        this.type = null;
    }

    static fromProductDto(productDto, def = false) {
        const price = def ? (productDto.retailPrice ?? 0) : 0;
        const dto = new SaleProductDto(
            null,
            null,
            productDto.id,
            productDto.name,
            productDto.image,
            productDto.unitId,
            productDto.unitName,
            productDto.unitShortName,
            def ? 1 : 0,
            price
        );
        dto.type = productDto.type;
        return dto;
    }

    imgUrl() {
        return getImageUrl(this.productImage);
    }

    icons() {
        return this.type == 1
            ? '<i class="fas fa-box text-[#3571A4]" title="Товар"></i>'
            : '<i class="fas fa-concierge-bell text-[#3571A4]" title="Услуга"></i>';
    }

    static fromApiArray(dataArray) {
        return createFromApiArray(dataArray, data => {
            const dto = new SaleProductDto(
                data.id,
                data.sale_id,
                data.product_id,
                data.product_name,
                data.product_image,
                data.unit_id,
                data.unit_name,
                data.unit_short_name,
                data.quantity,
                data.price
            );
            dto.type = data.type;
            return dto;
        }).filter(Boolean);
    }
}