import { dtoDateFormatters } from '@/utils/dateUtils';
import { createFromApiArray } from '@/utils/dtoUtils';

export default class TransactionCategoryDto {
    constructor({ id, name, type, user_id, user_name, created_at, updated_at }) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.userId = user_id;
        this.userName = user_name;
        this.createdAt = created_at;
        this.updatedAt = updated_at;
    }

    typeClass() {
        return this.type ? '✅' : '🔺';
    }

    typeText() {
        return this.type ? 'Приход' : 'Расход';
    }

    formatCreatedAt() {
        return dtoDateFormatters.formatCreatedAt(this.createdAt);
    }

    formatUpdatedAt() {
        return dtoDateFormatters.formatUpdatedAt(this.updatedAt);
    }

    canBeDeleted() {
        const protectedCategories = [
            'Перемещение',
            'Выплата зарплаты',
            'Продажа',
            'Предоплата',
            'Оплата покупателя за услугу, товар',
            'Прочий приход денег',
            'Возврат денег покупателю',
            'Оплата поставщикам товаров, запчастей',
            'Прочий расход денег'
        ];
        
        return !protectedCategories.includes(this.name);
    }

    canBeEdited() {
        return this.canBeDeleted();
    }

    static fromApiArray(dataArray) {
        return createFromApiArray(dataArray, data => {
            return new TransactionCategoryDto({
                id: data.id,
                name: data.name,
                type: data.type,
                user_id: data.user_id,
                user_name: data.user_name,
                created_at: data.created_at,
                updated_at: data.updated_at
            });
        }).filter(Boolean);
    }
}
