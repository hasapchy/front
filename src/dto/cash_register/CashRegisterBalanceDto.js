import CashRegisterBalanceItemDto from "./CashRegisterBalanceItemDto";
import { createFromApiArray } from '@/utils/dtoUtils';
import { getCashRegisterDisplayNameByParts } from '@/utils/cashRegisterUtils';

export default class CashRegisterBalanceDto {
    constructor(id, name, balance = [], currencyCode = null, isCash = true, icon = null, color = null) {
        this.id = id;
        this.name = name;
        this.balance = balance;
        this.currencyCode = currencyCode;
        this.isCash = Number(isCash) === 1;
        this.displayName = getCashRegisterDisplayNameByParts(this.name, this.isCash);
        this.icon = icon ?? null;
        this.color = color ?? null;
    }

    static fromApiArray(dataArray) {
        return createFromApiArray(dataArray, data => {
            const balance = data.balance ? CashRegisterBalanceItemDto.fromApiArray(data.balance) : [];
            
            return new CashRegisterBalanceDto(
                data.id,
                data.name,
                balance,
                data.currency_code,
                data.is_cash,
                data.icon,
                data.color,
            );
        }).filter(Boolean);
    }
}