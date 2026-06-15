import dayjs from 'dayjs';
import { getCurrentServerDateObject } from '@/utils/dateUtils';

/**
 * @param {object|null|undefined} item
 * @returns {boolean}
 */
export function isTaskDeadlineActive(item) {
    const statusId = Number(item?.statusId);
    if ([1, 2, 3].includes(statusId)) {
        return true;
    }
    const statusName = item?.status?.name;
    return statusName === 'NEW' || statusName === 'PENDING' || statusName === 'IN_PROGRESS';
}

/**
 * @param {string|Date|null|undefined} deadline
 * @param {object} options
 * @param {boolean} [options.active]
 * @param {Date} [options.now]
 * @param {(key: string, params?: object) => string} [options.t]
 * @returns {object|null}
 */
export function resolveTaskDeadlineState(deadline, options = {}) {
    if (!deadline) {
        return null;
    }
    const parsed = dayjs(deadline);
    if (!parsed.isValid()) {
        return null;
    }

    const now = options.now ?? getCurrentServerDateObject();
    const t = options.t ?? ((key) => key);
    const active = options.active !== false;
    const today = dayjs(now).startOf('day');
    const deadlineDay = parsed.startOf('day');
    const diffDays = deadlineDay.diff(today, 'day');

    let tone = '';
    let relativeLabel = '';

    if (active) {
        if (parsed.isBefore(now)) {
            tone = 'danger';
            const overdueDays = Math.max(1, today.diff(deadlineDay, 'day'));
            relativeLabel = t('taskDeadlineOverdueDays', { days: overdueDays });
        } else if (diffDays === 0) {
            tone = 'warning';
            relativeLabel = t('today');
        } else if (diffDays === 1) {
            tone = 'warning';
            relativeLabel = t('tomorrow');
        } else if (diffDays > 1 && diffDays <= 3) {
            tone = 'warning';
            relativeLabel = t('taskDeadlineInDays', { days: diffDays });
        } else if (diffDays > 3) {
            relativeLabel = t('taskDeadlineInDays', { days: diffDays });
        }
    } else if (diffDays === 0) {
        relativeLabel = t('today');
    } else if (diffDays === 1) {
        relativeLabel = t('tomorrow');
    } else if (diffDays === -1) {
        relativeLabel = t('yesterday');
    }

    return {
        dateLabel: parsed.format('DD.MM.YYYY'),
        timeLabel: parsed.format('HH:mm'),
        relativeLabel,
        tone,
    };
}
