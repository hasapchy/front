import { dayjsDate, dayjsDateTime } from "@/utils/dateUtils";
import ClientDto from "../client/ClientDto";
import SaleProductDto from "./SaleProductDto";

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
    client = null,
    products = null,
    note = "",
    date = "",
    createdAt = "",
    updatedAt = ""
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
    /** @type {ClientDto | null} */
    this.client = client;
    /** @type {Array<SaleProductDto> | null} */
    this.products = products;
    this.note = note;
    this.date = date;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  priceInfo() {
    const symbol = this.currencySymbol || "m";
    const isDiscount = this.price !== this.totalPrice;

    if (!isDiscount) {
      return `${this.totalPrice} ${symbol}`;
    }

    return `${this.totalPrice} ${symbol} (${this.price} ${symbol}, скидка: ${this.discount} ${symbol})`;
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
