import { dayjsDate, dayjsDateTime } from "@/utils/dateUtils";
import { formatCurrency } from "@/utils/numberUtils";
import OrderAfValueDto from "./OrderAfValueDto";

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
    currencyId,
    currencyName,
    currencyCode,
    currencySymbol,
    date = "",
    createdAt = "",
    updatedAt = "",
    client = null,
    products = null,
    additionalFields = null
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
    this.currencyId = currencyId;
    this.currencyName = currencyName;
    this.currencyCode = currencyCode;
    this.currencySymbol = currencySymbol;
    this.date = date;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.client = client;
    this.products = products;
    this.additionalFields = additionalFields;
  }

  priceInfo() {
    if (this.discount && this.discount > 0) {
      return `${formatCurrency(this.totalPrice, this.currencySymbol)} (из ${formatCurrency(this.price, this.currencySymbol)}, скидка ${formatCurrency(this.discount, this.currencySymbol)})`;
    }
    return formatCurrency(this.totalPrice, this.currencySymbol);
  }

  productsHtmlList() {
    if (this.products === null || this.products.length === 0) {
      return "";
    }
    if (this.products.length === 1) {
      const product = this.products[0];
      return `<span>${product.productName} - ${product.quantity}${product.unitShortName}</span>`;
    }
    // Формируем строку для тултипа
    const tooltip = this.products
      .map(
        (product) => `${product.productName} - ${product.quantity}${product.unitShortName}`
      )
      .join('\n');
    // Показываем первый товар и троеточие, остальное в тултипе
    const first = this.products[0];
    return `<span title="${tooltip}">${first.productName} - ${first.quantity}${first.unitShortName} ...</span>`;
  }

  formatDate() {
    if (!this.date) return '';
    try {
      const formatted = dayjsDateTime(this.date);
      // Проверяем, что dayjs вернул валидную дату, а не "Invalid Date"
      if (formatted && formatted.toLowerCase().includes('invalid')) {
        return '';
      }
      return formatted;
    } catch {
      return '';
    }
  }

  formatCreatedAt() {
    return dayjsDate(this.createdAt);
  }

  formatUpdatedAt() {
    return dayjsDate(this.updatedAt);
  }


  getAdditionalFields() {
    if (!this.additionalFields) {
      return [];
    }
    return this.additionalFields.map(field => 
      OrderAfValueDto.fromApi(field)
    );
  }

  getAdditionalFieldsHtml() {
    const fields = this.getAdditionalFields();
    if (fields.length === 0) {
      return '';
    }

    return fields.map(field => field.getDisplayHtml()).join('');
  }

  hasAdditionalFields() {
    return this.additionalFields && this.additionalFields.length > 0;
  }

  getAdditionalFieldsCount() {
    return this.additionalFields ? this.additionalFields.length : 0;
  }

  getRequiredFields() {
    return this.getAdditionalFields().filter(field => field.isRequired());
  }

  areRequiredFieldsFilled() {
    const requiredFields = this.getRequiredFields();
    return requiredFields.every(field => field.value && field.value.trim() !== '');
  }
}
