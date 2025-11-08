import CashRegisterBalanceItemDto from "./CashRegisterBalanceItemDto";
import { createFromApiArray } from '@/utils/dtoUtils';

export default class CashRegisterBalanceDto {
    constructor(id, name, balance = [], currencySymbol = null, currencyCode = null) {
        this.id = id;
        this.name = name;
        this.balance = balance;
        this.currencySymbol = currencySymbol;
        this.currencyCode = currencyCode;
    }

    static fromApiArray(dataArray) {
        return createFromApiArray(dataArray, data => {
            const balance = data.balance ? CashRegisterBalanceItemDto.fromApiArray(data.balance) : [];
            
            return new CashRegisterBalanceDto(
                data.id,
                data.name,
                balance,
                data.currency_symbol,
                data.currency_code
            );
        }).filter(Boolean);
    }
}