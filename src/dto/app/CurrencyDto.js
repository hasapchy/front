class CurrencyDto {
    constructor({ id, code, name, symbol, is_default, is_report, status }) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.symbol = symbol;
        this.is_default = is_default;
        this.is_report = is_report;
        this.status = status;
    }
}

export default CurrencyDto;