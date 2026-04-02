import { dtoDateFormatters } from "@/utils/dateUtils";
import { formatCurrency } from "@/utils/numberUtils";
import { createFromApiArray } from "@/utils/dtoUtils";
import { getCashRegisterDisplayNameByParts, formatCashRegisterDisplay } from "@/utils/cashRegisterUtils";
import ClientDto from "@/dto/client/ClientDto";
import SaleProductDto from "./SaleProductDto";
import i18n from "@/i18n";
import { dt } from "@/utils/displayI18n";

export default class SaleDto {
  constructor(
    id,
    price,
    discount,
    totalPrice,
    currencyId,
    currencyName,
    currencySymbol,
    cashId,
    cashName,
    warehouseId,
    warehouseName,
    creatorId,
    creator,
    projectId,
    projectName,
    transactionId = null,
    client = null,
    products = null,
    note = "",
    date = "",
    createdAt = "",
    updatedAt = "",
    discountType = "fixed"
  ) {
    this.id = id;
    this.price = price;
    this.discount = discount;
    this.discountType = discountType;
    this.totalPrice = totalPrice;
    this.currencyId = currencyId;
    this.currencyName = currencyName;
    this.currencySymbol = currencySymbol;
    this.cashId = cashId;
    this.cashName = cashName;
    this.warehouseId = warehouseId;
    this.warehouseName = warehouseName;
    this.creatorId = creatorId;
    this.creator = creator ?? null;
    this.projectId = projectId;
    this.projectName = projectName;
    this.transactionId = transactionId;
    this.client = client;
    this.products = products;
    this.note = note;
    this.date = date;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  priceInfo() {
    const symbol = this.currencySymbol || i18n.global.t("noCurrency");
    if (!this.discount || this.discount <= 0) {
      return formatCurrency(this.totalPrice, symbol);
    }
    return dt("salePriceLine", {
      total: formatCurrency(this.totalPrice, symbol),
      discount: formatCurrency(this.discount, symbol),
    });
  }


  cashNameDisplay() {
    return formatCashRegisterDisplay(this.cashName, this.currencySymbol);
  }

  warehouseNameDisplay() {
    return this.warehouseName || dt("warehouseNotSpecified");
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
    const client = data.client ? ClientDto.fromApi(data.client) : null;
    const products = data.products ? SaleProductDto.fromApiArray(data.products) : null;
    const totalPrice = (parseFloat(data.price || 0) - parseFloat(data.discount || 0));

    return new SaleDto(
      data.id,
      data.price,
      data.discount,
      totalPrice,
      data.cash_register?.currency?.id ?? null,
      data.cash_register?.currency?.name ?? null,
      data.cash_register?.currency?.symbol ?? null,
      data.cash_id,
      getCashRegisterDisplayNameByParts(data.cash_register?.name, data.cash_register?.is_cash),
      data.warehouse_id,
      data.warehouse ? data.warehouse.name : null,
      data.creator_id,
      data.creator ?? null,
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
  }

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, SaleDto.fromApi).filter(Boolean);
  }
}
