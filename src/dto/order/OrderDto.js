import { dtoDateFormatters } from "@/utils/dateUtils";
import { formatCurrency, formatNumber } from "@/utils/numberUtils";
import { createProductsTooltipList, createFromApiArray } from "@/utils/dtoUtils";
import ClientDto from "@/dto/client/ClientDto";
import OrderProductDto from "./OrderProductDto";

export default class OrderDto {
  constructor(
    id,
    note = "",
    description = "",
    statusId,
    statusName,
    categoryId,
    categoryName,
    clientId,
    userId,
    userName,
    userPhoto = null,
    cashId,
    cashName,
    warehouseId,
    warehouseName,
    projectId,
    projectName,
    price,
    discount,
    totalPrice,
    paidAmount = 0,
    currencyId,
    currencyName,
    currencyCode,
    currencySymbol,
    date = "",
    createdAt = "",
    updatedAt = "",
    client = null,
    products = null
  ) {
    this.id = id;
    this.note = note;
    this.description = description;
    this.statusId = statusId;
    this.statusName = statusName;
    this.categoryId = categoryId;
    this.categoryName = categoryName;
    this.clientId = clientId;
    this.userId = userId;
    this.userName = userName;
    this.userPhoto = userPhoto;
    this.cashId = cashId;
    this.cashName = cashName;
    this.warehouseId = warehouseId;
    this.warehouseName = warehouseName;
    this.projectId = projectId;
    this.projectName = projectName;
    this.price = price;
    this.discount = discount;
    this.totalPrice = totalPrice;
    this.paidAmount = paidAmount;
    this.currencyId = currencyId;
    this.currencyName = currencyName;
    this.currencyCode = currencyCode;
    this.currencySymbol = currencySymbol;
    this.date = date;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.client = client;
    this.products = products;
  }

  priceInfo() {
    if (!this.discount || this.discount <= 0) {
      return formatCurrency(this.totalPrice, this.currencySymbol, null, true);
    }
    return `${formatCurrency(this.totalPrice, this.currencySymbol, null, true)} (из ${formatCurrency(this.price, this.currencySymbol, null, true)}, скидка ${formatCurrency(this.discount, this.currencySymbol, null, true)})`;
  }

  formatQuantity(quantity) {
    const num = Number(quantity);
    return isNaN(num) || !quantity ? '0.00' : formatNumber(quantity, 2, true);
  }


  formatDate() {
    return dtoDateFormatters.formatDate(this.date);
  }

  formatCreatedAt() {
    return dtoDateFormatters.formatCreatedAt(this.createdAt);
  }

  formatUpdatedAt() {
    return dtoDateFormatters.formatUpdatedAt(this.updatedAt);
  }

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, data => {
      const client = data.client ? ClientDto.fromApiArray([data.client])[0] || null : null;
      const products = data.products ? OrderProductDto.fromApiArray(data.products) : null;
      
      return new OrderDto(
        data.id,
        data.note ?? "",
        data.description ?? "",
        data.status_id,
        data.status_name,
        data.category_id ?? data.product_category_id,
        data.category_name ?? data.product_category_name,
        data.client_id,
        data.user_id,
        data.user_name,
        data.user_photo,
        data.cash_id ?? null,
        data.cash_name ?? null,
        data.warehouse_id,
        data.warehouse_name,
        data.project_id,
        data.project_name,
        data.price,
        data.discount ?? 0,
        data.total_price,
        data.paid_amount ?? 0,
        data.currency_id,
        data.currency_name,
        data.currency_code,
        data.currency_symbol,
        data.date,
        data.created_at,
        data.updated_at,
        client,
        products
      );
    }).filter(Boolean);
  }
}
