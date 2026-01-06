import { formatDatabaseDateTimeForInput, getCurrentLocalDateTime } from '@/utils/dateUtils';

/**
 * Миксин для работы с датами в формах
 * Предоставляет методы для форматирования дат и работы с datetime-local полями
 */
export default {
  methods: {
    /**
     * Форматирует дату для использования в input type="datetime-local"
     * Обрабатывает различные форматы входных данных (string, Date, null, undefined)
     * @param {string|Date|null|undefined} date - Дата для форматирования
     * @returns {string} Дата в формате YYYY-MM-DDTHH:mm или текущая дата, если date пустая
     */
    getFormattedDate(date) {
      if (!date) {
        return getCurrentLocalDateTime();
      }
      if (typeof date === 'string') {
        // Если уже в формате datetime-local, возвращаем как есть
        if (date.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)) {
          return date.substring(0, 16);
        }
        // Иначе конвертируем из формата базы данных
        return formatDatabaseDateTimeForInput(date);
      }
      if (date instanceof Date || date?.toISOString) {
        return formatDatabaseDateTimeForInput(date);
      }
      return getCurrentLocalDateTime();
    },

    /**
     * Получает текущую локальную дату и время в формате datetime-local
     * @returns {string} Текущая дата в формате YYYY-MM-DDTHH:mm
     */
    getCurrentLocalDateTime() {
      return getCurrentLocalDateTime();
    },

    /**
     * Форматирует дату из базы данных для input type="datetime-local"
     * @param {string|Date} date - Дата из базы данных
     * @returns {string} Дата в формате YYYY-MM-DDTHH:mm или пустая строка
     */
    formatDatabaseDateTimeForInput(date) {
      return formatDatabaseDateTimeForInput(date);
    },

    /**
     * Проверяет, может ли пользователь редактировать дату
     * @returns {boolean} true, если пользователь имеет право редактировать любую дату
     */
    canEditDate() {
      return this.$store.getters.hasPermission('settings_edit_any_date');
    },

    /**
     * Получает минимальную дату для input type="datetime-local"
     * Если пользователь не может редактировать дату, возвращает текущую дату
     * @returns {string|null} Минимальная дата или null, если ограничений нет
     */
    getMinDate() {
      return this.canEditDate() ? null : this.getCurrentLocalDateTime();
    }
  }
};

