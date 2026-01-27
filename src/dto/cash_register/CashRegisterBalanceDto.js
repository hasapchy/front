import CashRegisterBalanceItemDto from "./CashRegisterBalanceItemDto";
import { createFromApiArray } from '@/utils/dtoUtils';

export default class CashRegisterBalanceDto {
    constructor(id, name, balance = [], currencySymbol = null, isCash = true, icon = null) {
        this.id = id;
        this.name = name;
        this.balance = balance;
        this.currencySymbol = currencySymbol;
        this.isCash = Boolean(isCash);
        this.icon = icon || null;
    }

    static fromApiArray(dataArray) {
        return createFromApiArray(dataArray, data => {
            const balance = data.balance ? CashRegisterBalanceItemDto.fromApiArray(data.balance) : [];
            
            return new CashRegisterBalanceDto(
                data.id,
                data.name,
                balance,
                data.currency_symbol,
                data.is_cash,
                data.icon,
            );
        }).filter(Boolean);
    }
}