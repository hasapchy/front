import { dtoDateFormatters } from "@/utils/dateUtils";
import { formatCurrency } from "@/utils/numberUtils";
import { createProductsHtmlList, createFromApiArray } from "@/utils/dtoUtils";
import ClientDto from "@/dto/client/ClientDto";
import WarehouseReceiptProductDto from "./WarehouseReceiptProductDto";
import i18n from "@/i18n";

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
    cashName = null,
    projectId = null,
    currencySymbol = null
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
    this.projectId = projectId;
    this.currencySymbol = currencySymbol;
    this.type = this.cashId ? 'cash' : 'balance';
  }

  cashNameDisplay() {
    return this.cashName || i18n.global.t("notSpecified");
  }
  
  paymentTypeDisplay() {
    return this.type === "cash"
      ? i18n.global.t("toCash")
      : i18n.global.t("inDebt");
  }

  priceInfo() {
    const symbol = this.currencySymbol || "";
    const total = this.totalPrice ?? this.amount ?? this.price ?? 0;
    return formatCurrency(total, symbol);
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
      const client = data.supplier ? ClientDto.fromApiArray([data.supplier])[0] || null : null;
      const products = data.products ? WarehouseReceiptProductDto.fromApiArray(data.products) : null;
      const currencySymbol = data.cash_register?.currency?.symbol || '';
      
      return new WarehouseReceiptDto(
        data.id,
        data.warehouse_id,
        data.warehouse?.name || '',
        data.amount,
        client,
        products,
        data.note,
        data.user_id,
        data.user?.name || '',
        data.date,
        data.created_at,
        data.updated_at,
        data.cash_id,
        data.cash_register?.name || '',
        data.project_id,
        currencySymbol
      );
    }).filter(Boolean);
  }
}
