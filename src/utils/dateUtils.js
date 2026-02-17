import dayjs from "dayjs";

// Функции для отображения дат ТОЧНО как они хранятся в базе данных
// База данных хранит даты в Asia/Ashgabat (UTC+5), поэтому показываем их без конвертации

export function dayjsDate(date, format = "DD MMM YYYYг") {
  if (!date) return '';
  // Показываем дату точно как в базе данных
  return dayjs(date).locale("ru").format(format);
}

export function dayjsDateTime(date, format = "HH:mm DD MMM YYYYг") {
  if (!date) return '';
  // Показываем дату и время точно как в базе данных
  return dayjs(date).locale("ru").format(format);
}

// Функция для отображения даты точно как в базе (без конвертации часовых поясов)
export function formatDatabaseDate(date) {
  if (!date) return '';
  // Разбираем дату как есть, без конвертации
  const dateObj = new Date(date);
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${day}.${month}.${year}`;
}

// Функция для отображения даты и времени точно как в базе
export function formatDatabaseDateTime(date) {
  if (!date) return '';
  // Разбираем дату как есть, без конвертации
  const dateObj = new Date(date);
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes} ${day}.${month}.${year}`;
}


/**
 * Конвертирует дату из базы данных в формат datetime-local для input
 * Без конвертации часовых поясов - показывает точно как в БД
 */
export function formatDatabaseDateTimeForInput(date) {
  if (!date) return '';
  // Конвертируем дату из базы данных в формат datetime-local без UTC смещения
  const dateObj = new Date(date);
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function getCurrentLocalDateTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Получает текущее время в Asia/Ashgabat (UTC+5) в формате datetime-local
 * Используется когда нужно показать время в часовом поясе сервера
 */
export function getCurrentAsiaDateTime() {
  // Получаем текущее время в UTC
  const now = new Date();
  // Добавляем 5 часов (Asia/Ashgabat = UTC+5)
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  const asiaTime = new Date(utcTime + (5 * 3600000)); // +5 часов
  
  const year = asiaTime.getUTCFullYear();
  const month = String(asiaTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(asiaTime.getUTCDate()).padStart(2, '0');
  const hours = String(asiaTime.getUTCHours()).padStart(2, '0');
  const minutes = String(asiaTime.getUTCMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}


export function formatOrderDate(date) {
  if (!date) return '';
  // Используем новый подход для точного отображения
  return formatDatabaseDateTime(date);
}

export const dtoDateFormatters = {
  formatDate(date) {
    if (!date) return '';
    try {
      // Используем точное отображение даты из базы данных
      const formatted = formatDatabaseDateTime(date);
      if (!formatted) {
        return '';
      }
      return formatted;
    } catch {
      return '';
    }
  },

  formatCreatedAt(createdAt) {
    return formatDatabaseDate(createdAt);
  },

  formatUpdatedAt(updatedAt) {
    return formatDatabaseDate(updatedAt);
  }
};