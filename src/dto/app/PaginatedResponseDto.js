// PaginatedResponse описывает структуру ответа с пагинацией
export default class PaginatedResponseDto {
    constructor(items = [], currentPage = 1, nextPage = null, lastPage = 1, total = 0) {
        this.items = items; // Список элементов
        this.currentPage = currentPage; // Текущая страница
        this.nextPage = nextPage; // Ссылка на следующую страницу (если есть)
        this.lastPage = lastPage; // Последняя страница
        this.total = total; // Общее количество элементов
    }
}
