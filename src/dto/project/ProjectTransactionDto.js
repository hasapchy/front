export default class ProjectTransactionDto {
    constructor(
        id,
        userId,
        userName,
        projectId,
        projectName,
        amount,
        currencyId,
        currencyName,
        currencyCode,
        currencySymbol,
        note,
        date,
        createdAt,
        updatedAt
    ) {
        this.id = id;
        this.userId = userId;
        this.userName = userName;
        this.projectId = projectId;
        this.projectName = projectName;
        this.amount = amount;
        this.currencyId = currencyId;
        this.currencyName = currencyName;
        this.currencyCode = currencyCode;
        this.currencySymbol = currencySymbol;
        this.note = note;
        this.date = date;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    static fromApi(data) {
        return new ProjectTransactionDto(
            data.id,
            data.user_id,
            data.user?.name || data.user_name,
            data.project_id,
            data.project?.name || data.project_name,
            data.amount,
            data.currency_id,
            data.currency?.name || data.currency_name,
            data.currency?.code || data.currency_code,
            data.currency?.symbol || data.currency_symbol,
            data.note,
            data.date,
            data.created_at,
            data.updated_at
        );
    }

    formatAmount() {
        return Number(this.amount).toFixed(2);
    }

    formatAmountWithCurrency() {
        return `${this.formatAmount()} ${this.currencySymbol || this.currencyCode}`;
    }

    formatDate() {
        if (!this.date) return '';
        const date = new Date(this.date);
        return date.toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatDateTime() {
        if (!this.date) return '';
        const date = new Date(this.date);
        return date.toLocaleString('ru-RU', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    getDescription() {
        return this.note || 'Приход';
    }

    getSource() {
        return 'project_transaction';
    }

    getSourceId() {
        return this.id;
    }

    getLabel() {
        return 'Приход';
    }

    formatAmountWithColor() {
        return `<span class="text-green-600 font-semibold">+${this.formatAmountWithCurrency()}</span>`;
    }
}
