import dayjs from 'dayjs';
import { toDayjsLocale } from '@/utils/dateUtils';

/**
 * @param {string|Date|null|undefined} date
 * @param {string} locale
 * @returns {{ month: string, day: string }}
 */
export function parseCardDateParts(date, locale = 'ru') {
    if (!date) {
        return { month: '', day: '' };
    }
    const parsed = dayjs(date).locale(toDayjsLocale(locale));
    if (!parsed.isValid()) {
        return { month: '', day: '' };
    }
    return {
        month: parsed.format('MMM').toUpperCase(),
        day: parsed.format('D'),
    };
}
