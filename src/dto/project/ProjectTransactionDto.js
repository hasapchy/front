import { dtoDateFormatters } from '@/utils/dateUtils';
import { formatNumber } from '@/utils/numberUtils';

import { createFromApiArray } from '@/utils/dtoUtils';

export default class ProjectTransactionDto {
    constructor(
        id,
        userId,
        userName,
        projectId,
        projectName,
        type,
        amount,
        currencyId,
        currencyName,
        currencySymbol,
        categoryId,
        categoryName,
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
        this.type = type;
        this.amount = amount;
        this.currencyId = currencyId;
        this.currencyName = currencyName;
        this.currencySymbol = currencySymbol;
        this.categoryId = categoryId;
        this.categoryName = categoryName;
        this.note = note;
        this.date = date;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    static fromApi(data) {
        return new ProjectTransactionDto(
            data.id,
            data.user_id || data.userId,
            data.user_name || data.user?.name || data.userName || null,
            data.project_id || data.projectId,
            data.project_name || data.project?.name || data.projectName || null,
            data.type,
            data.amount,
            data.currency_id || data.currencyId,
            data.currency_name || data.currency?.name || data.currencyName || null,
            data.currency_symbol || data.currency?.symbol || data.currencySymbol || null,
            data.category_id || data.categoryId || null,
            data.category_name || data.category?.name || data.categoryName || null,
            data.note,
            data.date,
            data.created_at || data.createdAt,
            data.updated_at || data.updatedAt
        );
    }

    static fromApiArray(dataArray) {
        return createFromApiArray(dataArray, data => {
            return ProjectTransactionDto.fromApi(data);
        }).filter(Boolean);
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
