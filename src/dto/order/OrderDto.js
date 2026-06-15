import { dtoDateFormatters } from "@/utils/dateUtils";
import { formatCurrencyForDisplay, formatQuantity } from "@/utils/numberUtils";
import { createFromApiArray } from "@/utils/dtoUtils";
import { getCashRegisterDisplayNameByParts } from "@/utils/cashRegisterUtils";
import ClientDto from "@/dto/client/ClientDto";
import { normalizeUserForCell } from "@/utils/userCellUtils";
import OrderProductDto from "./OrderProductDto";
import { dt } from "@/utils/displayI18n";

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
    creatorId,
    creator = null,
    cashId,
    cashName,
    clientBalanceId = null,
    warehouseId,
    warehouseName,
    projectId,
    projectName,
    price,
    discount,
    totalPrice,
    paidAmount = 0,
    paymentStatus = null,
    paymentStatusText = null,
    currencyId,
    currencyName,
    currencyCode,
    date = "",
    createdAt = "",
    updatedAt = "",
    client = null,
    products = null,
    discountType = "fixed"
  ) {
    this.id = id;
    this.note = note;
    this.description = description;
    this.statusId = statusId;
    this.statusName = statusName;
    this.categoryId = categoryId;
    this.categoryName = categoryName;
    this.clientId = clientId;
    this.creatorId = creatorId;
    this.creator = creator;
    this.cashId = cashId;
    this.cashName = cashName;
    this.clientBalanceId = clientBalanceId;
    this.warehouseId = warehouseId;
    this.warehouseName = warehouseName;
    this.projectId = projectId;
    this.projectName = projectName;
    this.price = price;
    this.discount = discount;
    this.totalPrice = totalPrice;
    this.paidAmount = paidAmount;
    this.paymentStatus = paymentStatus;
    this.paymentStatusText = paymentStatusText;
    this.currencyId = currencyId;
    this.currencyName = currencyName;
    this.currencyCode = currencyCode;
    this.date = date;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.client = client;
    this.products = products;
    this.discountType = discountType;
    this.status = null;
    this.defTotalPrice = null;
  }

  documentCurrencyCode() {
    return this.currencyCode;
  }

  documentTotalPrice() {
    return Number(this.totalPrice ?? 0);
  }

  documentSubtotalPrice() {
    return Number(this.price ?? 0);
  }

  priceInfo() {
    const sym = this.documentCurrencyCode();
    const total = this.documentTotalPrice();
    const subtotal = this.documentSubtotalPrice();
    const discount = Number(this.discount ?? 0);
    if (!discount || discount <= 0) {
      return formatCurrencyForDisplay(total, sym, true);
    }
    return dt("orderPriceWithDiscount", {
      total: formatCurrencyForDisplay(total, sym, true),
      price: formatCurrencyForDisplay(subtotal, sym, true),
      discount: formatCurrencyForDisplay(discount, sym, true),
    });
  }

  formatDate() {
    return dtoDateFormatters.formatDate(this.date);
  }

  static fromApi(data) {
    if (!data) return null;
    const client = data.client ? ClientDto.fromApi(data.client) : null;
    const products = data.products
      ? OrderProductDto.fromApiArray(data.products)
      : null;

    const order = new OrderDto(
      data.id,
      data.note ?? "",
      data.description ?? "",
      data.status_id,
      data.status?.name ?? null,
      data.category_id,
      data.category?.name ?? null,
      data.client_id,
      data.creator_id,
      data.creator,
      data.cash_id,
      getCashRegisterDisplayNameByParts(
        data.cash_register?.name,
        data.cash_register?.is_cash
      ),
      data.client_balance_id ?? null,
      data.warehouse_id,
      data.warehouse?.name ?? null,
      data.project_id,
      data.project?.name ?? null,
      data.price != null ? Number(data.price) : 0,
      data.discount != null ? Number(data.discount) : 0,
      data.total_price != null ? Number(data.total_price) : 0,
      data.paid_amount ?? 0,
      data.payment_status ?? null,
      data.payment_status_text ?? null,
      data.currency_id,
      data.currency?.name ?? null,
      data.currency?.code ?? null,
      data.date,
      data.created_at,
      data.updated_at,
      client,
      products,
      data.discount_type ?? "fixed"
    );
    order.status = data.status ?? null;
    order.project = data.project ?? null;
    order.creator = data.creator ? normalizeUserForCell(data.creator) : null;
    order.defTotalPrice = data.def_total_price != null ? Number(data.def_total_price) : null;
    return order;
  }

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, OrderDto.fromApi).filter(Boolean);
  }
}
