import { dayjsDate, dayjsDateTime } from "@/utils/dateUtils";

export default class OrderDto {
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
    statusId,
    statusName,
    categoryId,
    categoryName,
    client = null,
    products = null,
    note = "",
    description = "",
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
    this.statusId = statusId;
    this.statusName = statusName;
    this.categoryId = categoryId;
    this.categoryName = categoryName;
    this.client = client;
    this.products = products;
    this.note = note;
    this.description = description;
    this.date = date;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  priceInfo() {
    if (this.discount && this.discount > 0) {
      return `${this.totalPrice} ${this.currencySymbol} (из ${this.price} ${this.currencySymbol}, скидка ${this.discount} ${this.currencySymbol})`;
    }
    return `${this.totalPrice} ${this.currencySymbol}`;
  }

  productsHtmlList() {
    if (this.products === null || this.products.length === 0) {
      return "";
    }
    if (this.products.length === 1) {
      const product = this.products[0];
      return `<span>${product.productName} - ${product.quantity}${product.unitShortName}</span>`;
    }
    // Формируем строку для тултипа
    const tooltip = this.products
      .map(
        (product) => `${product.productName} - ${product.quantity}${product.unitShortName}`
      )
      .join('\n');
    // Показываем первый товар и троеточие, остальное в тултипе
    const first = this.products[0];
    return `<span title="${tooltip}">${first.productName} - ${first.quantity}${first.unitShortName} ...</span>`;
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
