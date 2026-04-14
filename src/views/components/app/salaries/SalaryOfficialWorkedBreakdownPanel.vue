<template>
  <div
    v-if="breakdown"
    class="space-y-4"
  >
    <div>
      <div class="text-xs font-medium text-gray-500 mb-1 dark:text-[var(--text-secondary)]">
        {{ $t('salaryOfficialWorkedCalcMonth') }}
      </div>
      <div class="dark:text-[var(--text-primary)]">
        {{ formatShortDateRangeOrDash(breakdown.month_from, breakdown.month_to) }}
      </div>
    </div>
    <div v-if="breakdown.employment_differs_from_month">
      <div class="text-xs font-medium text-gray-500 mb-1 dark:text-[var(--text-secondary)]">
        {{ $t('salaryOfficialWorkedFactPeriod') }}
      </div>
      <div class="dark:text-[var(--text-primary)]">
        {{ formatShortDateRangeOrDash(breakdown.employment_from, breakdown.employment_to) }}
      </div>
    </div>
    <div v-if="breakdown.leave_periods.length">
      <div class="text-xs font-medium text-gray-500 mb-2 dark:text-[var(--text-secondary)]">
        {{ $t('salaryOfficialWorkedLeaveHeading') }}
      </div>
      <ul class="space-y-2 list-none pl-0">
        <li
          v-for="(p, idx) in breakdown.leave_periods"
          :key="idx"
          class="border border-gray-100 rounded px-3 py-2 dark:border-[var(--border-subtle)]"
        >
          <div class="font-medium dark:text-[var(--text-primary)]">
            {{ leaveTypeLabel(p.leave_type_name) }}
          </div>
          <div class="text-gray-700 text-xs mt-1 dark:text-[var(--text-secondary)]">
            {{ formatShortDateRangeOrDash(p.date_from, p.date_to) }}
          </div>
          <div class="text-gray-600 text-xs mt-0.5 dark:text-[var(--text-secondary)]">
            {{ $t('salaryOfficialWorkedLeaveOfficialDays', { n: p.official_days }) }}
          </div>
        </li>
      </ul>
      <div
        v-if="Number(breakdown.leave_official_days_total) > 0"
        class="text-xs text-gray-600 mt-2 dark:text-[var(--text-secondary)]"
      >
        {{ $t('salaryOfficialWorkedDeductedUniqueDays', { n: breakdown.leave_official_days_total }) }}
      </div>
    </div>
  </div>
</template>

<script>
import { formatShortDateRangeOrDash } from '@/utils/dateUtils';
import { translateLeaveType } from '@/utils/translationUtils';

export default {
    name: 'SalaryOfficialWorkedBreakdownPanel',
    props: {
        breakdown: {
            type: Object,
            default: null,
        },
    },
    methods: {
        formatShortDateRangeOrDash,
        leaveTypeLabel(name) {
            return name ? translateLeaveType(name, this.$t) : '—';
        },
    },
};
</script>
