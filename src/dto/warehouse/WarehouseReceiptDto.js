import { dayjsDate } from "@/utils/dateUtils";
import ClientDto from "../client/ClientDto";
import WarehouseReceiptProductDto from "./WarehouseReceiptProductDto";

export default class WarehouseReceiptDto {
  constructor(
    id,
    warehouseId,
    warehouseName,
    amount,
    // currencyId,
    client = null,
    products = null,
    note = "",
    date = "",
    createdAt = "",
    updatedAt = ""
  ) {
    this.id = id;
    this.warehouseId = warehouseId;
    this.warehouseName = warehouseName;
    this.amount = amount;
    //Паша, переходим без выбора валюты this.currencyId = currencyId;
    /** @type {ClientDto | null} */
    this.client = client;
    /** @type {Array<WarehouseReceiptProductDto> | null} */
    this.products = products;
    this.note = note;
    this.date = date;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
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
    const symbol = this.currencySymbol || "m";
    const total = this.totalPrice ?? this.amount ?? this.price ?? 0;
    return `${total} ${symbol}`;
  }

  formatDate() {
    return this.date !== null ? dayjsDate(this.date) : "-";
  }

  formatCreatedAt() {
    return dayjsDate(this.createdAt);
  }

  formatUpdatedAt() {
    return dayjsDate(this.updatedAt);
  }
}
