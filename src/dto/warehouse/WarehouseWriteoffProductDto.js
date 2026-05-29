import { getImageUrl, createFromApiArray } from '@/utils/dtoUtils';

export default class WarehouseWriteoffProductDto {
  constructor(
    id,
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
    sourceReceiptProductId = null
  ) {
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
    this.origUnitId = null;
    this.origQuantity = null;
    this.origUnitShortName = null;
    this.alternateInputUnitId = null;
  }

  static fromProductDto(productDto) {
    return new WarehouseWriteoffProductDto(
      null,
      null,
      productDto.id,
      productDto.name,
      productDto.image,
      productDto.unitId,
      productDto.unitName,
      productDto.unitShortName,
      0,
      productDto.stockQuantity ?? 0,
      productDto.purchasePrice ?? 0,
      null
    );
  }

  imgUrl() {
    return getImageUrl(this.productImage);
  }

  static fromApi(data) {
    if (!data) {
      return null;
    }

    const row = new WarehouseWriteoffProductDto(
      data.id,
      data.write_off_id,
      data.product_id,
      data.product_name,
      data.product_image,
      data.unit_id,
      data.unit_name,
      data.unit_short_name,
      Number(data.quantity) || 0,
      Number(data.stock_quantity) || 0,
      Number(data.price ?? 0),
      data.source_receipt_product_id != null ? Number(data.source_receipt_product_id) : null
    );

    const ou = data.orig_unit_id;
    row.origUnitId = ou != null && ou !== '' ? Number(ou) : null;
    const oq = data.orig_quantity;
    row.origQuantity = oq != null && oq !== '' ? Number(oq) : null;
    row.origUnitShortName = data.orig_unit_short_name != null && data.orig_unit_short_name !== ''
      ? String(data.orig_unit_short_name)
      : null;
    if (row.origUnitId != null && row.unitId != null && row.origUnitId !== row.unitId) {
      row.alternateInputUnitId = row.origUnitId;
    }

    return row;
  }

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, WarehouseWriteoffProductDto.fromApi).filter(Boolean);
  }
}
