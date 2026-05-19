import dayjs from 'dayjs';

/**
 * @param {{ date: string, endDate?: string|null, isRecurring?: boolean }} holiday
 * @param {import('dayjs').Dayjs} [reference]
 * @returns {{ start: import('dayjs').Dayjs, end: import('dayjs').Dayjs }}
 */
export function resolveHolidayOccurrence(holiday, reference = dayjs()) {
  const startBase = dayjs(holiday.date);
  const endBase = holiday.endDate ? dayjs(holiday.endDate) : startBase;

  if (!holiday.isRecurring) {
    return { start: startBase, end: endBase };
  }

  const applyYear = (year) => {
    let start = startBase.year(year);
    let end = endBase.year(year);
    if (end.isBefore(start, 'day')) {
      end = endBase.year(year + 1);
    }
    return { start, end };
  };

  const year = reference.year();
  let occurrence = applyYear(year);
  if (occurrence.end.isBefore(reference, 'day')) {
    occurrence = applyYear(year + 1);
  }

  return occurrence;
}

/**
 * @param {import('dayjs').Dayjs} start
 * @param {import('dayjs').Dayjs} end
 * @param {string} [locale]
 * @returns {string}
 */
export function formatHolidayDateRange(start, end, locale = 'ru') {
  dayjs.locale(locale);

  if (!end || end.isSame(start, 'day')) {
    return start.format('D MMMM');
  }

  if (start.year() === end.year() && start.month() === end.month()) {
    return `${start.format('D')} – ${end.format('D MMMM')}`;
  }

  if (start.year() === end.year()) {
    return `${start.format('D MMMM')} – ${end.format('D MMMM')}`;
  }

  return `${start.format('D MMMM YYYY')} – ${end.format('D MMMM YYYY')}`;
}
