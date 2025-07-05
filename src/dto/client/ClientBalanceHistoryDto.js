export default class ClientBalanceHistoryDto {
    constructor(source, sourceId, date, amount, description) {
        this.source = source; // тип источника: 'sale', 'receipt', 'transaction', 'order'
        this.sourceId = sourceId; // ID записи
        this.date = date; // дата
        this.amount = parseFloat(amount); // сумма со знаком
        this.description = description; // описание
    }

    formattedAmount() {
        const sign = this.amount >= 0 ? '+' : '-';
        return `${sign}${Math.abs(this.amount).toFixed(2)}`;
    }

    formatDate() {
        return new Date(this.date).toLocaleDateString(); // или используй dayjs
    }

    label() {
        switch (this.source) {
            case 'sale':
                return 'Продажа';
            case 'receipt':
                return 'Оприходование';
            case 'transaction':
                return 'Транзакция';
            case 'order':
                return 'Заказ';
            default:
                return 'Операция';
        }
    }
}
