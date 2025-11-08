import { createFromApiArray } from '@/utils/dtoUtils';

class CurrencyDto {
    constructor({ id, code, name, symbol, is_default, is_report, status }) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.symbol = symbol;
        this.isDefault = is_default;
        this.isReport = is_report;
        this.status = status;
    }

    static fromApiArray(dataArray) {
        return createFromApiArray(dataArray, data => {
            return new CurrencyDto({
                id: data.id,
                code: data.code,
                name: data.name,
                symbol: data.symbol,
                is_default: data.is_default,
                is_report: data.is_report,
                status: data.status
            });
        }).filter(Boolean);
    }
}

export default CurrencyDto;