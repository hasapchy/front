import { createFromApiArray } from '@/utils/dtoUtils';

export default class CashRegisterBalanceItemDto {
    constructor(value, title, type) {
        this.value = value;
        this.title = title;
        this.type = type;
    }

    static fromApiArray(dataArray) {
        return createFromApiArray(dataArray, data => {
            return new CashRegisterBalanceItemDto(
                data.value,
                data.title,
                data.type
            );
        }).filter(Boolean);
    }
}