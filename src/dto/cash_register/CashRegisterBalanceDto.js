import CashRegisterBalanceItemDto from "./CashRegisterBalanceItemDto";

export default class CashRegisterBalanceDto {
    constructor(id, name, balance = []) {
        this.id = id;
        this.name = name;
        /** @type {Array<CashRegisterBalanceItemDto> | null} */
        this.balance = balance;
    }
}