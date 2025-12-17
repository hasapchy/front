import { dtoDateFormatters } from '@/utils/dateUtils';
import { formatNumber } from '@/utils/numberUtils';

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
            data.user_name || data.user?.name || null,
            data.project_id,
            data.project_name || data.project?.name || null,
            data.amount,
            data.currency_id,
            data.currency_name || data.currency?.name || null,
            data.currency_symbol || data.currency?.symbol || null,
            data.note,
            data.date,
            data.created_at,
            data.updated_at
        );
    }

    formatAmount() {
        return formatNumber(this.amount || 0, null, true);
    }

    formatAmountWithCurrency() {
        return `${this.formatAmount()} ${this.currencySymbol || ''}`;
    }

    formatDate() {
        return dtoDateFormatters.formatDate(this.date);
    }

    formatDateTime() {
        if (!this.date) return '';
        return dtoDateFormatters.formatDate(this.date);
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

}
