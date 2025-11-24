import { formatAmountWithColor } from '@/utils/dtoUtils';
import { formatNumber } from '@/utils/numberUtils';
import BaseDto from "@/dto/BaseDto";

export default class ProjectTransactionDto extends BaseDto {
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
            data.user_name || data.user?.name,
            data.project_id,
            data.project_name || data.project?.name,
            data.amount,
            data.currency_id,
            data.currency_name || data.currency?.name,
            data.currency_code || data.currency?.code,
            data.currency_symbol || data.currency?.symbol,
            data.note,
            data.date,
            data.created_at,
            data.updated_at
        );
    }

    formatAmount() {
        return formatNumber(this.amount ?? 0, null, true);
    }

    formatAmountWithCurrency() {
        return `${this.formatAmount()} ${this.currencySymbol ?? this.currencyCode}`;
    }

    formatDateTime() {
        return this.formatDate();
    }

    getDescription() {
        return this.note ?? 'Приход';
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
        return formatAmountWithColor(this.amount, {
            positiveColor: "text-green-600",
            showSign: true,
            formatFn: () => this.formatAmountWithCurrency(),
            className: "font-semibold"
        });
    }
}
