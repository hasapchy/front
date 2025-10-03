import { dayjsDate, dayjsDateTime } from "@/utils/dateUtils";

export default class SaleDto {
  constructor(
    id,
    price,
    discount,
    totalPrice,
    currencyId,
    currencyName,
    currencyCode,
    currencySymbol,
    cashId,
    cashName,
    warehouseId,
    warehouseName,
    userId,
    userName,
    projectId,
    projectName,
    transactionId = null,
    client = null,
    products = null,
    note = "",
    date = "",
    createdAt = "",
    updatedAt = "",
    _transactions = null
  ) {
    this.id = id;
    this.price = price;
    this.discount = discount;
    this.totalPrice = totalPrice;
    this.currencyId = currencyId;
    this.currencyName = currencyName;
    this.currencyCode = currencyCode;
    this.currencySymbol = currencySymbol;
    this.cashId = cashId;
    this.cashName = cashName;
    this.warehouseId = warehouseId;
    this.warehouseName = warehouseName;
    this.userId = userId;
    this.userName = userName;
    this.projectId = projectId;
    this.projectName = projectName;
    this.transactionId = transactionId;
    /** @type {Object | null} */
    this.client = client;
    /** @type {Array<Object> | null} */
    this.products = products;
    this.note = note;
    this.date = date;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  priceInfo() {
    const symbol = this.currencySymbol || "Нет валюты";
    const isDiscount = this.discount > 0;

    if (!isDiscount) {
      return `${this.totalPrice} ${symbol}`;
    }

    return `${this.totalPrice} ${symbol} (скидка: ${this.discount} ${symbol})`;
  }

  productsHtmlList() {
    if (this.products === null) {
      return "";
    }
    var res = "<ul>";
    this.products.forEach((product) => {
      res += `<li style="display: flex; align-items: center; gap: 10px;">`;
      if (product.productImage !== null) {
        res += `<img src="${product.imgUrl()}" alt="" width="20px" class="rounded">`;
      }
      res += `${product.productName} - ${product.quantity}${product.unitShortName}</li>`;
    });
    res += "</ul>";
    return res;
  }

  cashNameDisplay() {
    return this.cashName || "";
  }

  warehouseNameDisplay() {
    return this.warehouseName ? this.warehouseName : "Склад не указан";
  }

  formatDate() {
    return dayjsDateTime(this.date);
  }

  formatCreatedAt() {
    return dayjsDate(this.createdAt);
  }

  formatUpdatedAt() {
    return dayjsDate(this.updatedAt);
  }
}
