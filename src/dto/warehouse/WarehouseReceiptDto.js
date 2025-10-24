import { dayjsDate, dayjsDateTime } from "@/utils/dateUtils";
import { formatCurrency } from "@/utils/numberUtils";
import ClientDto from "../client/ClientDto";
import WarehouseReceiptProductDto from "./WarehouseReceiptProductDto";

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
    
    // Вычисляемое поле: если есть cashId, то тип "cash", иначе "balance"
    this.type = this.cashId ? 'cash' : 'balance';
  }

  productsHtmlList() {
    if (this.products === null) {
      return "";
    }
    var res = "<ul>";
    this.products.forEach((product) => {
      res += `<li style="display: flex; align-items: center; gap: 10px;">`;
      if (product.productImage !== null) {
        res += `<img src="${product.imgUrl()}" alt="" width="20px" class="rounded">`;
      }
      res += `${product.productName} - ${product.quantity}${product.unitShortName}</li>`;
    });
    res += "</ul>";
    return res;
  }
  cashNameDisplay() {
    // Согласно новой архитектуре, касса всегда указывается
    // Тип операции (кредит или нет) определяется полем is_debt в транзакции
    return this.cashName || "Не указана";
  }
  
  paymentTypeDisplay() {
    // Вычисляем тип оплаты на основе того, как было создано
    // Согласно новой архитектуре: cash_id всегда заполнен, type определяет is_debt
    return this.type === 'cash' ? 'В кассу' : 'В кредит';
  }

  priceInfo() {
    const symbol = this.currencySymbol || "m"; // По умолчанию "m" (манат)

    const total = this.totalPrice ?? this.amount ?? this.price ?? 0;
    return formatCurrency(total, symbol);
  }

  formatDate() {
    return dayjsDateTime(this.date);
  }

  formatCreatedAt() {
    return dayjsDate(this.createdAt);
  }

  formatUpdatedAt() {
    return dayjsDate(this.updatedAt);
  }
}
