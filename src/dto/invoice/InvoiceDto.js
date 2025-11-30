import { dtoDateFormatters } from "@/utils/dateUtils";
import { formatCurrency } from "@/utils/numberUtils";
import { createProductsTooltipList, createFromApiArray } from "@/utils/dtoUtils";
import ClientDto from "@/dto/client/ClientDto";
import InvoiceProductDto from "./InvoiceProductDto";
import OrderDto from "@/dto/order/OrderDto";

export default class InvoiceDto {
  constructor(
    id,
    clientId,
    userId,
    userName,
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
    this.userId = userId;
    this.userName = userName;
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
    const isValidCurrency = (value) => {
      if (typeof value !== 'string' || !value) return false;
      const trimmed = value.trim();
      if (/^\d{4}-\d{2}-\d{2}([\sT]\d{2}:\d{2}:\d{2}.*)?Z?$/.test(trimmed)) return false;
      return trimmed && trimmed !== 'Нет валюты' && trimmed !== 'TMT';
    };
    
    let currencySymbol = 'TMT';
    if (this.orders?.length > 0) {
      const firstOrder = this.orders[0];
      if (firstOrder.currencySymbol && isValidCurrency(firstOrder.currencySymbol)) {
        currencySymbol = firstOrder.currencySymbol.trim();
      } else if (firstOrder.currencyCode && isValidCurrency(firstOrder.currencyCode)) {
        currencySymbol = firstOrder.currencyCode.trim();
      } else if (firstOrder.currencyName && isValidCurrency(firstOrder.currencyName)) {
        currencySymbol = firstOrder.currencyName.trim();
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

  getStatusLabel() {
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

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, data => {
      const client = data.client ? ClientDto.fromApiArray([data.client])[0] || null : null;
      
      const orders = data.orders ? OrderDto.fromApiArray(data.orders.map(order => ({
        ...order,
        currency_id: order.currency_id ?? order.cash?.currency?.id ?? null,
        currency_name: order.currency_name ?? order.cash?.currency?.name ?? null,
        currency_code: order.currency_code ?? order.cash?.currency?.code ?? null,
        currency_symbol: order.currency_symbol ?? order.cash?.currency?.symbol ?? null,
        client: data.client,
        category_id: null,
        category_name: null
      }))) : null;
      
      const products = data.products ? InvoiceProductDto.fromApiArray(data.products) : null;
      
      return new InvoiceDto(
        data.id,
        data.client_id,
        data.user_id,
        data.user_name,
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
    }).filter(Boolean);
  }
}
