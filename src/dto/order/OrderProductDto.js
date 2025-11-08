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
  }

  static fromProductDto(productDto, def = false) {
    return new OrderProductDto(
      null,
      null,
      productDto.id,
      productDto.name,
      productDto.image,
      productDto.unit_id,
      productDto.unit_name,
      productDto.unit_short_name,
      def ? 1 : 0,
      def ? productDto.sale_price : 0
    );
  }

  imgUrl() {
    return getImageUrl(this.productImage);
  }

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, data => {
      return new OrderProductDto(
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
    }).filter(Boolean);
  }
}
