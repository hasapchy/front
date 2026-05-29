import { getImageUrl, createFromApiArray } from '@/utils/dtoUtils';

export default class WarehouseMovementProductDto {
  constructor(
    id,
    movementId,
    productId,
    productName,
    productImage,
    unitId,
    unitName,
    unitShortName,
    quantity
  ) {
    this.id = id;
    this.movementId = movementId;
    this.productId = productId;
    this.productName = productName;
    this.productImage = productImage;
    this.unitId = unitId;
    this.unitName = unitName;
    this.unitShortName = unitShortName;
    this.quantity = quantity;
    this.origUnitId = null;
    this.origQuantity = null;
    this.origUnitShortName = null;
    this.alternateInputUnitId = null;
  }

  static fromProductDto(productDto) {
    return new WarehouseMovementProductDto(
      null,
      null,
      productDto.id,
      productDto.name,
      productDto.image,
      productDto.unitId,
      productDto.unitName,
      productDto.unitShortName,
      0
    );
  }

  imgUrl() {
    return getImageUrl(this.productImage);
  }

  static fromApi(data) {
    if (!data) {
      return null;
    }

    const row = new WarehouseMovementProductDto(
      data.id,
      data.movement_id,
      data.product_id,
      data.product_name,
      data.product_image,
      data.unit_id,
      data.unit_name,
      data.unit_short_name,
      Number(data.quantity) || 0
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
    return createFromApiArray(dataArray, WarehouseMovementProductDto.fromApi).filter(Boolean);
  }
}
