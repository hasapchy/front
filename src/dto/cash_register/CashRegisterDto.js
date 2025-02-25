import { dayjsDate } from "@/utils/dateUtils";

export default class CashRegisterDto {
    constructor(id, name, balance, users = [], currency_id, currency_name, currency_code, currency_symbol, createdAt = '', updatedAt = '') {
        this.id = id;
        this.name = name;
        this.balance = balance;
        this.users = users;
        this.currency_id = currency_id,
        this.currency_name = currency_name,
        this.currency_code = currency_code,
        this.currency_symbol = currency_symbol,
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    formatCreatedAt() {
        return dayjsDate(this.createdAt);
    }

    formatUpdatedAt() {
        return dayjsDate(this.updatedAt);
    }
}