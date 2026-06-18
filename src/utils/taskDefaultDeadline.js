import dayjs from 'dayjs';
import { effectiveWorkSchedule as buildEffectiveWorkSchedule } from '@/constants/defaultWorkSchedule';
import { getScheduleDayKeyFromDayjsDay } from '@/utils/dateUtils';

export function getDefaultTaskDeadline(company) {
  const workSchedule = buildEffectiveWorkSchedule(company?.workSchedule);
  const targetDate = dayjs().add(5, 'day');
  const scheduleDayKey = getScheduleDayKeyFromDayjsDay(targetDate.day());
  const daySchedule = workSchedule[scheduleDayKey];

  if (daySchedule?.end) {
    const [endHour, endMinute] = daySchedule.end.split(':').map(Number);
    return targetDate.hour(endHour).minute(endMinute).second(0).millisecond(0)
      .format('YYYY-MM-DDTHH:mm');
  }

  return targetDate.hour(18).minute(0).second(0).millisecond(0)
    .format('YYYY-MM-DDTHH:mm');
}
