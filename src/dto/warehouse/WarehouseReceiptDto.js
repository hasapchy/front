import { dayjsDate, dayjsDateTime } from "@/utils/dateUtils";
import ClientDto from "../client/ClientDto";
import WarehouseReceiptProductDto from "./WarehouseReceiptProductDto";

export default class WarehouseReceiptDto {
  constructor(
    id,
    warehouseId,
    warehouseName,
    amount,
    client = null,
    products = null,
    note = "",
    userId,
    userName,
    date = "",
    createdAt = "",
    updatedAt = "",
    cashId = null,
    cashName = null
  ) {
    this.id = id;
    this.warehouseId = warehouseId;
    this.warehouseName = warehouseName;
    this.amount = amount;
    this.client = client;
    this.products = products;
    this.note = note;
    this.userId = userId;
    this.userName = userName;
    this.date = date;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;

    this.cashId = cashId;
    this.cashName = cashName;
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
    return this.cashName ? this.cashName : "В долг (баланс)";
  }

  priceInfo() {
    const symbol =
      this.cash && this.cash.currency && this.cash.currency.symbol
        ? this.cash.currency.symbol
        : "m";

    const total = this.totalPrice ?? this.amount ?? this.price ?? 0;
    return `${total} ${symbol}`;
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
