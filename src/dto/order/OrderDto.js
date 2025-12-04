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
    // Временно отключена логика оплаты для производительности
    // paidAmount = 0,
    // paymentStatus = null,
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
    // Временно отключена логика оплаты для производительности
    // this.paidAmount = paidAmount;
    // this.paymentStatus = paymentStatus;
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

  productsHtmlList() {
    return createProductsHtmlList(this.products, (quantity) => this.formatQuantity(quantity));
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

  // Временно отключена логика оплаты для производительности
  // getPaymentStatusText() {
  //   if (this.paymentStatus) {
  //     switch (this.paymentStatus) {
  //       case 'unpaid':
  //         return 'Не оплачено';
  //       case 'partially_paid':
  //         return 'Частично оплачено';
  //       case 'paid':
  //         return 'Оплачено';
  //       default:
  //         return 'Не оплачено';
  //     }
  //   }
  //   
  //   const paidAmount = parseFloat(this.paidAmount || 0);
  //   const totalPrice = parseFloat(this.totalPrice || 0);
  //   
  //   if (paidAmount <= 0) {
  //     return 'Не оплачено';
  //   } else if (paidAmount < totalPrice) {
  //     return 'Частично оплачено';
  //   } else {
  //     return 'Оплачено';
  //   }
  // }

  // getPaymentStatusClass() {
  //   if (this.paymentStatus) {
  //     switch (this.paymentStatus) {
  //       case 'unpaid':
  //         return 'text-red-600';
  //       case 'partially_paid':
  //         return 'text-yellow-600';
  //       case 'paid':
  //         return 'text-green-600';
  //       default:
  //         return 'text-gray-600';
  //     }
  //   }
  //   
  //   const paidAmount = parseFloat(this.paidAmount || 0);
  //   const totalPrice = parseFloat(this.totalPrice || 0);
  //   
  //   if (paidAmount <= 0) {
  //     return 'text-red-600';
  //   } else if (paidAmount < totalPrice) {
  //     return 'text-yellow-600';
  //   } else {
  //     return 'text-green-600';
  //   }
  // }

  // getPaymentStatusIcon() {
  //   if (this.paymentStatus) {
  //     switch (this.paymentStatus) {
  //       case 'unpaid':
  //         return 'fas fa-times-circle';
  //       case 'partially_paid':
  //         return 'fas fa-exclamation-circle';
  //       case 'paid':
  //         return 'fas fa-check-circle';
  //       default:
  //         return 'fas fa-question-circle';
  //     }
  //   }
  //   
  //   const paidAmount = parseFloat(this.paidAmount || 0);
  //   const totalPrice = parseFloat(this.totalPrice || 0);
  //   
  //   if (paidAmount <= 0) {
  //     return 'fas fa-times-circle';
  //   } else if (paidAmount < totalPrice) {
  //     return 'fas fa-exclamation-circle';
  //   } else {
  //     return 'fas fa-check-circle';
  //   }
  // }

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
        // Временно отключена логика оплаты для производительности
        // data.paid_amount ?? 0,
        // data.payment_status ?? null,
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
