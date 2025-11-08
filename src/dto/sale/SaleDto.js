import { dtoDateFormatters } from "@/utils/dateUtils";
import { formatCurrency } from "@/utils/numberUtils";
import { createProductsHtmlList, createFromApiArray } from "@/utils/dtoUtils";
import ClientDto from "@/dto/client/ClientDto";
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
    transactionId = null,
    client = null,
    products = null,
    note = "",
    date = "",
    createdAt = "",
    updatedAt = "",
    _transactions = null,
    discountType = "fixed"
  ) {
    this.id = id;
    this.price = price;
    this.discount = discount;
    this.discountType = discountType;
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
    if (!this.discount || this.discount <= 0) {
      return formatCurrency(this.totalPrice, symbol);
    }
    return `${formatCurrency(this.totalPrice, symbol)} (скидка: ${formatCurrency(this.discount, symbol)})`;
  }

  productsHtmlList() {
    return createProductsHtmlList(this.products);
  }

  cashNameDisplay() {
    return this.cashName || "";
  }

  warehouseNameDisplay() {
    return this.warehouseName || "Склад не указан";
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
      const products = data.products ? SaleProductDto.fromApiArray(data.products) : null;
      const totalPrice = (parseFloat(data.price || 0) - parseFloat(data.discount || 0));
      
      return new SaleDto(
        data.id,
        data.price,
        data.discount,
        totalPrice,
        data.cash_register && data.cash_register.currency ? data.cash_register.currency.id : data.currency_id,
        data.cash_register && data.cash_register.currency ? data.cash_register.currency.name : data.currency_name,
        data.cash_register && data.cash_register.currency ? data.cash_register.currency.code : data.currency_code,
        data.cash_register && data.cash_register.currency ? data.cash_register.currency.symbol : data.currency_symbol,
        data.cash_id,
        data.cash_register ? data.cash_register.name : null,
        data.warehouse_id,
        data.warehouse ? data.warehouse.name : null,
        data.user_id,
        data.user ? data.user.name : null,
        data.project_id,
        data.project ? data.project.name : null,
        data.transaction_id,
        client,
        products,
        data.note,
        data.date,
        data.created_at,
        data.updated_at,
        null,
        data.discount_type || "fixed"
      );
    }).filter(Boolean);
  }
}
