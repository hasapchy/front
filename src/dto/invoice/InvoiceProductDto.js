import { formatCurrency } from '@/utils/numberUtils';
import { createFromApiArray } from '@/utils/dtoUtils';

export default class InvoiceProductDto {
  constructor(
    id,
    invoiceId,
    orderId = null,
    productId,
    productName,
    productDescription = "",
    quantity = 0,
    price = 0,
    totalPrice = 0,
    unitId = null,
    unit = null
  ) {
    this.id = id;
    this.invoiceId = invoiceId;
    this.orderId = orderId;
    this.productId = productId;
    this.productName = productName;
    this.productDescription = productDescription;
    this.quantity = quantity;
    this.price = price;
    this.totalPrice = totalPrice;
    this.unitId = unitId;
    this.unit = unit;
  }

  getDisplayName() {
    return this.productName;
  }

  getQuantityWithUnit(store = null) {
    if (!this.unitId || !store) return `${this.quantity}`;
    const unitName = store.getters.getUnitShortName(this.unitId);
    return `${this.quantity}${unitName ? ' ' + unitName : ''}`;
  }

  getUnitName() {
    return this.unit?.short_name || this.unit?.name || 'шт.';
  }

  getPriceFormatted() {
    return formatCurrency(this.price, 'руб.', null, true);
  }

  getTotalPriceFormatted() {
    return formatCurrency(this.totalPrice, 'руб.', null, true);
  }

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, data => {
      return new InvoiceProductDto(
        data.id,
        data.invoice_id,
        data.order_id,
        data.product_id,
        data.product_name,
        data.product_description,
        data.quantity,
        data.price,
        data.total_price,
        data.unit_id,
        data.unit
      );
    }).filter(Boolean);
  }
}
