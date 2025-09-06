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
    if (!this.unitId || !store) {
      return `${this.quantity}`;
    }
    const unitName = store.getters.getUnitShortName(this.unitId);
    return `${this.quantity}${unitName ? ' ' + unitName : ''}`;
  }

  getUnitName() {
    if (this.unit && this.unit.short_name) {
      return this.unit.short_name;
    }
    if (this.unit && this.unit.name) {
      return this.unit.name;
    }
    return 'шт.';
  }

  getPriceFormatted() {
    return `${this.price} руб.`;
  }

  getTotalPriceFormatted() {
    return `${this.totalPrice} руб.`;
  }
}
