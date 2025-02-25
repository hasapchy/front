export default class TransactionCategoryDto {
    constructor({ id, name, type }) {
        this.id = id;
        this.name = name;
        this.type = type;
    }
    typeClass() {
        return this.type === 1 ? '✅' : '🔺';
    }
}
