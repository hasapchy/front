import { getImageUrl, createFromApiArray } from "@/utils/dtoUtils";

export default class OrderProductDto {
  constructor(
    id,
    orderId,
    productId,
    productName,
    productImage,
    unitId,
    unitName,
    unitShortName,
    quantity,
    price
  ) {
    this.id = id;
    this.orderId = orderId;
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
    const dto = new OrderProductDto(
      null,
      null,
      productDto.id,
      productDto.name,
      productDto.image,
      productDto.unitId,
      productDto.unitName,
      productDto.unitShortName,
      def ? 1 : 0,
      0
    );
    dto.type = productDto.type;
    dto.retailPrice = productDto.retailPrice;
    dto.wholesalePrice = productDto.wholesalePrice;
    return dto;
  }

  imgUrl() {
    return getImageUrl(this.productImage);
  }

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, data => {
      const dto = new OrderProductDto(
        data.id,
        data.order_id,
        data.product_id,
        data.product_name,
        data.product_image,
        data.unit_id,
        data.unit_name,
        data.unit_short_name,
        data.quantity,
        data.price
      );
      dto.type = data.type || (data.product ? data.product.type : null);
      return dto;
    }).filter(Boolean);
  }
}
