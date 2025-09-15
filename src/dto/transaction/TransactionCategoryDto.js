export default class TransactionCategoryDto {
    constructor({ id, name, type, user_id, user_name, created_at, updated_at }) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.user_id = user_id;
        this.user_name = user_name;
        this.created_at = created_at;
        this.updated_at = updated_at;
    }

    typeClass() {
        return this.type === 1 ? '✅' : '🔺';
    }

    typeText() {
        return this.type === 1 ? 'Приход' : 'Расход';
    }

    formatCreatedAt() {
        if (!this.created_at) return '';
        return new Date(this.created_at).toLocaleDateString();
    }

    formatUpdatedAt() {
        if (!this.updated_at) return '';
        return new Date(this.updated_at).toLocaleDateString();
    }

    // Проверка, можно ли удалить категорию
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

    // Проверка, можно ли редактировать категорию
    canBeEdited() {
        return this.canBeDeleted(); // Те же правила что и для удаления
    }
}
