<template>
  <div class="space-y-4">
    <div>
      <div class="text-xs font-medium text-gray-500 mb-1 dark:text-[var(--text-secondary)]">
        {{ $t('salaryOfficialNormScheduleOff') }}
      </div>
      <div class="text-gray-800 whitespace-pre-line dark:text-[var(--text-primary)]">
        {{ scheduleOffText }}
      </div>
    </div>
    <div>
      <div class="text-xs font-medium text-gray-500 mb-1 dark:text-[var(--text-secondary)]">
        {{ $t('salaryOfficialNormCalendarOff') }}
      </div>
      <div class="text-gray-800 whitespace-pre-line dark:text-[var(--text-primary)]">
        {{ calendarOffText }}
      </div>
    </div>
  </div>
</template>

<script>
import { formatShortDateListOrEmptyLabel } from '@/utils/dateUtils';

export default {
    name: 'SalaryNormNonWorkingPanel',
    props: {
        scheduleOffDates: {
            type: Array,
            default: () => [],
        },
        calendarOffDates: {
            type: Array,
            default: () => [],
        },
    },
    computed: {
        scheduleOffText() {
            return formatShortDateListOrEmptyLabel(this.scheduleOffDates, this.$t('salaryOfficialNormNoDates'));
        },
        calendarOffText() {
            return formatShortDateListOrEmptyLabel(this.calendarOffDates, this.$t('salaryOfficialNormNoDates'));
        },
    },
};
</script>
