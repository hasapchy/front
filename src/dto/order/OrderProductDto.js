import { getImageUrl, createFromApiArray } from "@/utils/dtoUtils";

export default class OrderProductDto {
  constructor(
    id,
    orderId,
    productId,
    productName,
    productImage,
    unitId,
    unitShortName,
    quantity,
    price,
    width = null,
    height = null,
    origUnitPrice = null,
    origCurrencyId = null,
    origCurrencySymbol = null
  ) {
    this.id = id;
    this.orderId = orderId;
    this.productId = productId;
    this.productName = productName;
    this.productImage = productImage;
    this.unitId = unitId;
    this.unitShortName = unitShortName;
    this.quantity = quantity;
    this.price = price;
    this.width = width;
    this.height = height;
    this.origUnitPrice = origUnitPrice;
    this.origCurrencyId = origCurrencyId;
    this.origCurrencySymbol = origCurrencySymbol;
    this.type = null;
  }

  static documentUnitPriceFromSavedLine(line) {
    const o = line.origUnitPrice ?? line.orig_unit_price;
    if (o != null && o !== "") {
      const n = Number(o);
      if (!Number.isNaN(n)) {
        return n;
      }
    }
    const p = Number(line.price || 0);
    return Number.isNaN(p) ? 0 : p;
  }

  static fromProductDto(productDto, def = false) {
    const dto = new OrderProductDto(
      null,
      null,
      productDto.id,
      productDto.name,
      productDto.image,
      productDto.unitId,
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
        data.unit_short_name,
        data.quantity,
        data.price,
        data.width ?? null,
        data.height ?? null,
        data.orig_unit_price != null ? Number(data.orig_unit_price) : null,
        data.orig_currency_id ?? null,
        data.orig_currency?.symbol ?? null
      );
      dto.type = data.type ?? null;
      return dto;
    }).filter(Boolean);
  }
}
