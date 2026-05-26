import { getImageUrl, createFromApiArray } from '@/utils/dtoUtils';

export default class WarehousePurchaseProductDto {
  constructor(
    id,
    purchaseId,
    productId,
    productName,
    productImage,
    unitId,
    unitName,
    unitShortName,
    quantity,
    price,
    origUnitPrice = null,
    origCurrencyId = null,
    origUnitId = null,
    origQuantity = null,
    origUnitShortName = null,
    remainingReceiptQuantity = null
  ) {
    this.id = id;
    this.purchaseId = purchaseId;
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
    this.origUnitPrice = origUnitPrice;
    this.origCurrencyId = origCurrencyId;
    this.origUnitId = origUnitId;
    this.origQuantity = origQuantity;
    this.origUnitShortName = origUnitShortName;
    this.stockByUnits = [];
    this.alternateUnitOptions = [];
    this.alternateInputUnitId = null;
    this.remainingReceiptQuantity = remainingReceiptQuantity;
  }

  imgUrl() {
    return getImageUrl(this.productImage);
  }

  static fromProductDto(productDto, def = false) {
    const quantity = 0;
    const price = 0;
    return new WarehousePurchaseProductDto(
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
      price,
      null,
      null,
      null,
      null
    );
  }

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, (data) => {
      const quantity = Number(data.quantity) || 0;
      const priceDefault = data.price != null && data.price !== '' ? Number(data.price) : null;
      const origUnitPrice = data.orig_unit_price != null && data.orig_unit_price !== ''
        ? Number(data.orig_unit_price)
        : priceDefault;

      const row = new WarehousePurchaseProductDto(
        data.id,
        data.purchase_id,
        data.product_id,
        data.product_name,
        data.product_image,
        data.unit_id,
        data.unit_name,
        data.unit_short_name,
        quantity,
        origUnitPrice ?? 0,
        origUnitPrice,
        data.orig_currency_id != null && data.orig_currency_id !== '' ? Number(data.orig_currency_id) : null,
        data.orig_unit_id != null && data.orig_unit_id !== '' ? Number(data.orig_unit_id) : null,
        data.orig_quantity != null && data.orig_quantity !== '' ? Number(data.orig_quantity) : null,
        data.orig_unit_short_name != null && data.orig_unit_short_name !== '' ? String(data.orig_unit_short_name) : null
      );

      row.stockByUnits = data.stock_by_units || [];
      row.alternateUnitOptions = data.alternate_unit_options || [];
      if (row.origUnitId != null && row.unitId != null && row.origUnitId !== row.unitId) {
        row.alternateInputUnitId = row.origUnitId;
      }
      if (priceDefault != null) {
        row.priceDefault = priceDefault;
        row.amountDefault = priceDefault * quantity;
      }
      row.amount = quantity * (Number(row.price) || 0);
      row.remainingReceiptQuantity = Number(data.remaining_receipt_quantity ?? 0);

      return row;
    }).filter(Boolean);
  }
}
