import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

function nowAshgabat() {
  return dayjs.utc().add(5, 'hour');
}

export function getCurrentLocalDateTime() {
  return nowAshgabat().format('YYYY-MM-DDTHH:mm');
}

export function getCurrentServerDate() {
  return nowAshgabat().format('YYYY-MM-DD');
}

export function getCurrentServerDateObject() {
  return nowAshgabat().toDate();
}

export function getCurrentServerStartOfDay() {
  const d = nowAshgabat().toDate();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function formatServerDateFromObject(d) {
  if (!d || !(d instanceof Date)) return '';
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getCurrentAsiaDateTime() {
  return nowAshgabat().format('YYYY-MM-DDTHH:mm');
}

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