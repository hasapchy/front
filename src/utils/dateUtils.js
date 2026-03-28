import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import "dayjs/locale/ru";
import "dayjs/locale/en";
import "dayjs/locale/tk";

dayjs.extend(utc);

function toDayjsLocale(i18nLocale) {
  if (i18nLocale === "tm") return "tk";
  return i18nLocale || "en";
}

export { toDayjsLocale };

function nowAshgabat() {
  return dayjs.utc().add(5, 'hour');
}

export function getCurrentLocalDateTime() {
  return nowAshgabat().format('YYYY-MM-DDTHH:mm');
}

export function getFormattedDate(date) {
  if (!date) return getCurrentLocalDateTime();
  if (date?.includes) {
    if (date.includes('Z') || /[-+]\d{2}:?\d{2}$/.test(date)) {
      return formatDatabaseDateTimeForInput(new Date(date));
    }
    if (date.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)) return date.substring(0, 16);
    return formatDatabaseDateTimeForInput(date);
  }
  if (date instanceof Date || date?.toISOString) return formatDatabaseDateTimeForInput(date);
  return getCurrentLocalDateTime();
}

export function getMinDateForForm(canEditAnyDate) {
  return canEditAnyDate ? null : getCurrentLocalDateTime();
}

export function getMaxDateForForm(serverNow) {
  return serverNow || getCurrentLocalDateTime();
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

export function isDateNotAfterNow(dateTimeString) {
  if (!dateTimeString) return true;
  const d = dayjs(dateTimeString);
  const now = nowAshgabat();
  return d.isBefore(now) || d.isSame(now);
}

const DAYJS_TO_SCHEDULE_DAY = { 0: 7, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6 };

export function getScheduleDayKeyFromDayjsDay(dayjsDay) {
  return DAYJS_TO_SCHEDULE_DAY[dayjsDay] ?? 1;
}

export function getLastWorkDayDayjs(workSchedule) {
  if (!workSchedule) return 5;
  for (let key = 7; key >= 1; key--) {
    const day = workSchedule[key];
    if (day && day.enabled) return key === 7 ? 0 : key;
  }
  return 5;
}

export function formatDatePickerLabel(d, i18nLocale) {
  if (d == null) return '';
  const d2 = dayjs(d);
  if (!d2.isValid()) return '';
  const locale = toDayjsLocale(i18nLocale);
  return d2.locale(locale).format('dddd, D MMMM');
}

export function formatDatePickerDisplay(value, type = 'datetime') {
  if (!value) return '';
  const d = dayjs(value);
  return d.isValid() ? (type === 'date' ? d.format('DD.MM.YYYY') : d.format('DD.MM.YYYY HH:mm')) : '';
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
      const formatted = formatDatabaseDateTime(date);
      if (!formatted) return '';
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

export const dateFormMixin = {
  methods: {
    getFormattedDate(date) {
      return getFormattedDate(date);
    },
    getCurrentLocalDateTime() {
      return getCurrentLocalDateTime();
    },
    formatDatabaseDateTimeForInput(date) {
      return formatDatabaseDateTimeForInput(date);
    },
    canEditDate() {
      return this.$store.getters.hasPermission('settings_edit_any_date');
    },
    getMinDate() {
      return getMinDateForForm(this.canEditDate());
    },
    getMaxDate() {
      return getMaxDateForForm(this.$store.getters?.serverNowForForms);
    }
  }
};