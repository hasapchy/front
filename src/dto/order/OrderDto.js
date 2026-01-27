import { dtoDateFormatters } from "@/utils/dateUtils";
import { formatCurrency, formatNumber } from "@/utils/numberUtils";
import { createProductsTooltipList, createProductsHtmlList, createFromApiArray } from "@/utils/dtoUtils";
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
    paymentStatus = null,
    paymentStatusText = null,
    currencyId,
    currencyName,
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
    this.paymentStatus = paymentStatus;
    this.paymentStatusText = paymentStatusText;
    this.currencyId = currencyId;
    this.currencyName = currencyName;
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

  productsHtmlList() {
    return createProductsHtmlList(this.products, (quantity) => this.formatQuantity(quantity), 3);
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

  getPaymentStatusText() {
    if (this.paymentStatusText) {
      return this.paymentStatusText;
    }
    
    if (this.paymentStatus) {
      switch (this.paymentStatus) {
        case 'unpaid':
          return 'Не оплачено';
        case 'partially_paid':
          return 'Частично оплачено';
        case 'paid':
          return 'Оплачено';
        default:
          return 'Не оплачено';
      }
    }
    
    const paidAmount = parseFloat(this.paidAmount || 0);
    const totalPrice = parseFloat(this.totalPrice || 0);
    
    if (paidAmount <= 0) {
      return 'Не оплачено';
    } else if (paidAmount < totalPrice) {
      return 'Частично оплачено';
    } else {
      return 'Оплачено';
    }
  }

  getPaymentStatusClass() {
    if (this.paymentStatus) {
      switch (this.paymentStatus) {
        case 'unpaid':
          return 'text-red-600';
        case 'partially_paid':
          return 'text-yellow-600';
        case 'paid':
          return 'text-green-600';
        default:
          return 'text-gray-600';
      }
    }
    
    const paidAmount = parseFloat(this.paidAmount || 0);
    const totalPrice = parseFloat(this.totalPrice || 0);
    
    if (paidAmount <= 0) {
      return 'text-red-600';
    } else if (paidAmount < totalPrice) {
      return 'text-yellow-600';
    } else {
      return 'text-green-600';
    }
  }

  getPaymentStatusIcon() {
    if (this.paymentStatus) {
      switch (this.paymentStatus) {
        case 'unpaid':
          return 'fas fa-times-circle';
        case 'partially_paid':
          return 'fas fa-exclamation-circle';
        case 'paid':
          return 'fas fa-check-circle';
        default:
          return 'fas fa-question-circle';
      }
    }
    
    const paidAmount = parseFloat(this.paidAmount || 0);
    const totalPrice = parseFloat(this.totalPrice || 0);
    
    if (paidAmount <= 0) {
      return 'fas fa-times-circle';
    } else if (paidAmount < totalPrice) {
      return 'fas fa-exclamation-circle';
    } else {
      return 'fas fa-check-circle';
    }
  }

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, data => {
      const client = data.client ? ClientDto.fromApiArray([data.client])[0] || null : null;
      const products = data.products ? OrderProductDto.fromApiArray(data.products) : null;
      const status = data.status || {};
      const category = data.category || {};
      const cash = data.cash || {};
      const cashCurrency = cash.currency || {};
      const warehouse = data.warehouse || {};
      const user = data.user || {};
      const project = data.project || {};
      
      return new OrderDto(
        data.id,
        data.note ?? "",
        data.description ?? "",
        data.status_id ?? status.id,
        status.name ?? null,
        data.category_id ?? category.id ?? null,
        category.name ?? null,
        data.client_id,
        data.user_id,
        user.name ?? null,
        user.photo ?? null,
        data.cash_id ?? cash.id ?? null,
        cash.name ?? null,
        data.warehouse_id ?? warehouse.id ?? null,
        warehouse.name ?? null,
        data.project_id ?? project.id ?? null,
        project.name ?? null,
        data.price,
        data.discount ?? 0,
        data.total_price,
        data.paid_amount ?? 0,
        data.payment_status ?? null,
        data.payment_status_text ?? null,
        cashCurrency?.id ?? data.currency_id ?? null,
        cashCurrency?.name ?? data.currency_name ?? null,
        cashCurrency?.symbol ?? data.currency_symbol ?? null,
        data.date,
        data.created_at,
        data.updated_at,
        client,
        products
      );
    }).filter(Boolean);
  }
}
