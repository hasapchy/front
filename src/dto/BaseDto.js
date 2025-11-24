import { dtoDateFormatters } from "@/utils/dateUtils";

/**
 * Базовый класс DTO с общими методами для всех DTO
 * Предоставляет стандартное форматирование дат и общие утилитные методы
 * @class BaseDto
 */
export default class BaseDto {
  /**
   * Форматирует поле date
   * @returns {string} Отформатированная строка даты или пустая строка
   */
  formatDate() {
    if (!this.date) return "";
    return dtoDateFormatters.formatDate(this.date);
  }

  /**
   * Форматирует поле createdAt
   * @returns {string} Отформатированная строка даты создания или пустая строка
   */
  formatCreatedAt() {
    if (!this.createdAt) return "";
    return dtoDateFormatters.formatCreatedAt(this.createdAt);
  }

  /**
   * Форматирует поле updatedAt
   * @returns {string} Отформатированная строка даты обновления или пустая строка
   */
  formatUpdatedAt() {
    if (!this.updatedAt) return "";
    return dtoDateFormatters.formatUpdatedAt(this.updatedAt);
  }

  /**
   * Геттер для dateUser (алиас для formatDate)
   * Используется в некоторых DTO для обратной совместимости
   * @returns {string} Отформатированная строка даты
   */
  get dateUser() {
    return this.formatDate();
  }
}
