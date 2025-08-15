import { dayjsDate } from "@/utils/dateUtils";

// CategoryDto описывает структуру категории
export default class CategoryDto {
    constructor(id, name, parentId = null, parentName = null, userId = null, userName = null, users = [], createdAt = '', updatedAt = '') {
        this.id = id; // Идентификатор категории
        this.name = name; // Название категории
        this.parentId = parentId; // Идентификатор родительской категории
        this.parentName = parentName; // Название родительской категории
        this.userId = userId; // Идентификатор пользователя
        this.userName = userName; // Имя пользователя
        this.users = users; // Список пользователей (объекты User)
        this.createdAt = createdAt; // Дата создания категории
        this.updatedAt = updatedAt; // Дата обновления категории
    }

    formatCreatedAt() {
        return dayjsDate(this.createdAt);
    }

    formatUpdatedAt() {
        return dayjsDate(this.updatedAt);
    }

    // Получить список ID пользователей
    getUserIds() {
        return this.users.map(user => user.id.toString());
    }

    // Получить список имен пользователей
    getUserNames() {
        return this.users.map(user => user.name).join(', ');
    }

    // Проверить, есть ли пользователь с указанным ID
    hasUser($userId) {
        return this.users.some(user => user.id == userId);
    }
}