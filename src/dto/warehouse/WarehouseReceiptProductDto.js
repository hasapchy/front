import { getImageUrl, createFromApiArray } from '@/utils/dtoUtils';

export default class WarehouseReceiptProductDto {
  constructor(
    id,
    receiptId,
    productId,
    productName,
    productImage,
    unitId,
    unitName,
    unitShortName,
    quantity,
    price,
    lineSubtotalDefault = null,
    allocatedExpensesDefault = null,
    landedLineTotalDefault = null
  ) {
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
    this.amount = (Number(quantity) || 0) * (Number(price) || 0);
    this.priceDefault = null;
    this.amountDefault = null;
    this.lineSubtotalDefault = lineSubtotalDefault;
    this.allocatedExpensesDefault = allocatedExpensesDefault;
    this.landedLineTotalDefault = landedLineTotalDefault;
    this.origUnitId = null;
    this.origQuantity = null;
    this.origUnitShortName = null;
    this.stockByUnits = [];
    this.alternateUnitOptions = [];
    this.alternateInputUnitId = null;
  }

  static fromProductDto(productDto, def = false) {
    const quantity = 0;
    const price = 0;
    return new WarehouseReceiptProductDto(
      null,
      null,
      productDto.id,
      productDto.name,
      productDto.image,
      productDto.unitId,
      productDto.unitName,
      productDto.unitShortName,
      quantity,
      price,
      null,
      null,
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

    const quantity = Number(data.quantity) || 0;
    const priceDefault = data.price != null && data.price !== '' ? Number(data.price) : null;
    const price = data.orig_unit_price != null && data.orig_unit_price !== ''
      ? Number(data.orig_unit_price)
      : (priceDefault ?? 0);

    const row = new WarehouseReceiptProductDto(
      data.id,
      data.receipt_id,
      data.product_id,
      data.product_name,
      data.product_image,
      data.unit_id,
      data.unit_name,
      data.unit_short_name,
      quantity,
      price,
      data.line_subtotal_default != null ? Number(data.line_subtotal_default) : null,
      data.allocated_expenses_default != null ? Number(data.allocated_expenses_default) : null,
      data.landed_line_total_default != null ? Number(data.landed_line_total_default) : null
    );

    const ou = data.orig_unit_id;
    row.origUnitId = ou != null && ou !== '' ? Number(ou) : null;
    const oq = data.orig_quantity;
    row.origQuantity = oq != null && oq !== '' ? Number(oq) : null;
    row.stockByUnits = data.stock_by_units || [];
    row.alternateUnitOptions = data.alternate_unit_options || [];
    if (row.origUnitId != null && row.unitId != null && row.origUnitId !== row.unitId) {
      row.alternateInputUnitId = row.origUnitId;
    }
    row.origUnitShortName = data.orig_unit_short_name != null && data.orig_unit_short_name !== ''
      ? String(data.orig_unit_short_name)
      : null;
    if (priceDefault != null) {
      row.priceDefault = priceDefault;
      row.amountDefault = data.line_subtotal_default != null && data.line_subtotal_default !== ''
        ? Number(data.line_subtotal_default)
        : priceDefault * quantity;
    }

    return row;
  }

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, WarehouseReceiptProductDto.fromApi).filter(Boolean);
  }
}
