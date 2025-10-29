import { dayjsDate, dayjsDateTime } from "@/utils/dateUtils";
import { formatCurrency } from "@/utils/numberUtils";

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
    // Получаем символ валюты из первого заказа или используем fallback
    let currencySymbol = 'Нет валюты';
    
    if (this.orders && this.orders.length > 0) {
      const firstOrder = this.orders[0];
      // Функция для проверки, что значение не является датой в формате ISO
      const isValidCurrency = (value) => {
        if (!value || typeof value !== 'string') return false;
        const trimmed = value.trim();
        // Исключаем даты в формате ISO (YYYY-MM-DD или с временем)
        if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}.*)?Z?$/.test(trimmed)) {
          return false;
        }
        return trimmed !== '' && trimmed !== 'Нет валюты';
      };
      
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

  productsHtmlList() {
    if (this.products === null || this.products.length === 0) {
      return "";
    }
    if (this.products.length === 1) {
      const product = this.products[0];
      return `<span>${product.productName} - ${product.quantity}${product.unitName || ''}</span>`;
    }
    // Формируем строку для тултипа
    const tooltip = this.products
      .map(
        (product) => `${product.productName} - ${product.quantity}${product.unitName || ''}`
      )
      .join('\n');
    // Показываем первый товар и троеточие, остальное в тултипе
    const first = this.products[0];
    return `<span title="${tooltip}">${first.productName} - ${first.quantity}${first.unitName || ''} ...</span>`;
  }

  formatDate() {
    return dayjsDateTime(this.invoiceDate);
  }

  formatCreatedAt() {
    return dayjsDate(this.createdAt);
  }

  formatUpdatedAt() {
    return dayjsDate(this.updatedAt);
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
}
