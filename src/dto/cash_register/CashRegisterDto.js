import { dayjsDate, dayjsDateTime } from "@/utils/dateUtils";

export default class CashRegisterDto {
  constructor(
    id,
    name,
    balance,
    users = [],
    currency_id,
    currency_name,
    currency_code,
    currency_symbol,
    createdAt = "",
    updatedAt = ""
  ) {
    this.id = id;
    this.name = name;
    this.balance = balance;
    this.users = users;
    this.currency_id = currency_id;
    this.currency_name = currency_name;
    this.currency_code = currency_code;
    this.currency_symbol = currency_symbol;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
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

  // Получить список ID пользователей
  getUserIds() {
    return this.users.map(user => user.id.toString());
  }

  // Получить список имен пользователей
  getUserNames() {
    return this.users.map(user => user.name).join(', ');
  }

  // Проверить, есть ли пользователь с указанным ID
  hasUser(userId) {
    return this.users.some(user => user.id == userId);
  }
}
