export default class FinancialAccountDto {
    constructor(id, code, name, type, balance, turnover) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.type = type;
        this.balance = balance;
        this.turnover = turnover;
    }

    static fromApi(data) {
        if (!data) return null;
        return new FinancialAccountDto(
            data.id,
            data.code,
            data.name,
            data.type,
            Number(data.balance ?? 0),
            Number(data.turnover ?? 0),
        );
    }

    static fromApiArray(items) {
        return (items ?? []).map((item) => FinancialAccountDto.fromApi(item)).filter(Boolean);
    }

    get displayName() {
        return `${this.code} — ${this.name}`;
    }
}
