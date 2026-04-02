import { dtoDateFormatters } from '@/utils/dateUtils';
import { createFromApiArray } from '@/utils/dtoUtils';
import { dt } from '@/utils/displayI18n';

export default class TransactionCategoryDto {
    constructor({ id, name, type, creator_id, creator, created_at, updated_at }) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.creatorId = creator_id;
        this.creator = creator ?? null;
        this.createdAt = created_at;
        this.updatedAt = updated_at;
    }

    typeClass() {
        return this.type ? '✅' : '🔺';
    }

    typeText() {
        return this.type ? dt('transactionCategoryIncome') : dt('transactionCategoryExpense');
    }

    formatCreatedAt() {
        return dtoDateFormatters.formatCreatedAt(this.createdAt);
    }

    formatUpdatedAt() {
        return dtoDateFormatters.formatUpdatedAt(this.updatedAt);
    }

    static fromApiArray(dataArray) {
        return createFromApiArray(dataArray, data => {
            return new TransactionCategoryDto({
                id: data.id,
                name: data.name,
                type: data.type,
                creator_id: data.creator_id,
                creator: data.creator ?? null,
                created_at: data.created_at,
                updated_at: data.updated_at
            });
        }).filter(Boolean);
    }
}
