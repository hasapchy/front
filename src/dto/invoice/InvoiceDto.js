import { dtoDateFormatters } from "@/utils/dateUtils";
import { formatCurrency } from "@/utils/numberUtils";
import { createFromApiArray } from "@/utils/dtoUtils";
import ClientDto from "@/dto/client/ClientDto";
import InvoiceProductDto from "./InvoiceProductDto";
import OrderDto from "@/dto/order/OrderDto";

export default class InvoiceDto {
  constructor(
    id,
    clientId,
    creatorId,
    creator,
    invoiceDate = "",
    note = "",
    totalAmount = 0,
    invoiceNumber = "",
    status = 'new',
    createdAt = "",
    updatedAt = "",
    client = null,
    orders = null,
    products = null
  ) {
    this.id = id;
    this.clientId = clientId;
    this.creatorId = creatorId;
    this.creator = creator ?? null;
    this.invoiceDate = invoiceDate;
    this.note = note;
    this.totalAmount = totalAmount;
    this.invoiceNumber = invoiceNumber;
    this.status = status;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.client = client;
    this.orders = orders;
    this.products = products;
  }


  amountInfo() {
    let currencySymbol = 'TMT';
    if (this.orders?.length > 0) {
      const sym = this.orders[0].currencySymbol;
      const trimmed = sym != null ? String(sym).trim() : '';
      if (trimmed && trimmed !== 'Нет валюты') {
        currencySymbol = trimmed;
      }
    }
    return formatCurrency(this.totalAmount, currencySymbol);
  }


  formatDate() {
    return dtoDateFormatters.formatDate(this.invoiceDate);
  }

  formatCreatedAt() {
    return dtoDateFormatters.formatCreatedAt(this.createdAt);
  }

  formatUpdatedAt() {
    return dtoDateFormatters.formatUpdatedAt(this.updatedAt);
  }

  getOrdersCount() {
    return this.orders ? this.orders.length : 0;
  }

  getProductsCount() {
    return this.products ? this.products.length : 0;
  }

  getStatusLabel(t = null) {
    if (t) {
      return t(this.status) || this.status;
    }
    switch (this.status) {
      case 'new':
        return 'Новый';
      case 'in_progress':
        return 'В работе';
      case 'paid':
        return 'Оплачен';
      case 'cancelled':
        return 'Отменен';
      default:
        return 'Неизвестно';
    }
  }

  getStatusClass() {
    switch (this.status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  static fromApi(data) {
    if (!data) return null;
    const client = data.client ? ClientDto.fromApi(data.client) : null;

    const orders = data.orders ? OrderDto.fromApiArray(data.orders) : null;

    const products = data.products ? InvoiceProductDto.fromApiArray(data.products) : null;

    return new InvoiceDto(
      data.id,
      data.client_id,
      data.creator_id,
      data.creator ?? null,
      data.invoice_date,
      data.note,
      data.total_amount,
      data.invoice_number,
      data.status || 'new',
      data.created_at,
      data.updated_at,
      client,
      orders,
      products
    );
  }

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, InvoiceDto.fromApi).filter(Boolean);
  }
}
