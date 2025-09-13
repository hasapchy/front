import CashRegisterBalanceItemDto from "./CashRegisterBalanceItemDto";

export default class CashRegisterBalanceDto {
    constructor(id, name, balance = [], currency_symbol = null, currency_code = null) {
        this.id = id;
        this.name = name;
        /** @type {Array<CashRegisterBalanceItemDto> | null} */
        this.balance = balance;
        this.currency_symbol = currency_symbol;
        this.currency_code = currency_code;
    }
}