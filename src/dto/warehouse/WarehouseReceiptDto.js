import { dtoDateFormatters } from "@/utils/dateUtils";
import { formatCurrency } from "@/utils/numberUtils";
import { createProductsHtmlList, createFromApiArray } from "@/utils/dtoUtils";
import ClientDto from "@/dto/client/ClientDto";
import WarehouseReceiptProductDto from "./WarehouseReceiptProductDto";
import i18n from "@/i18n";
import { getCashRegisterDisplayNameByParts, formatCashRegisterDisplay } from "@/utils/cashRegisterUtils";

export default class WarehouseReceiptDto {
  constructor(
    id,
    warehouseId,
    warehouseName,
    amount,
    client = null,
    products = null,
    note = "",
    creatorId,
    creator,
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
    this.creatorId = creatorId;
    this.creator = creator ?? null;
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
    if (this.cashId) {
      return formatCashRegisterDisplay(this.cashName, this.currencySymbol);
    }
    return i18n.global.t("notSpecified");
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

  static fromApi(data) {
    if (!data) return null;
    const client = data.supplier ? ClientDto.fromApi(data.supplier) : null;
    const products = data.products ? WarehouseReceiptProductDto.fromApiArray(data.products) : null;
    const currencySymbol = data.cash_register?.currency?.symbol ;

    return new WarehouseReceiptDto(
      data.id,
      data.warehouse_id,
      data.warehouse?.name ,
      data.amount,
      client,
      products,
      data.note,
      data.creator_id,
      data.creator ?? null,
      data.date,
      data.created_at,
      data.updated_at,
      data.cash_id,
      data.cash_id
        ? getCashRegisterDisplayNameByParts(data.cash_register?.name, data.cash_register?.is_cash)
        : null,
      data.project_id,
      currencySymbol
    );
  }

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, WarehouseReceiptDto.fromApi).filter(Boolean);
  }
}
