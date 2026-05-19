<template>
  <div class="bg-white dark:bg-[var(--surface-elevated)] rounded-lg shadow-sm border border-gray-200 dark:border-white/10 p-4 hover:shadow dark:hover:shadow-none transition-shadow duration-200">
    <div
      class="flex items-center justify-between mb-3 border-b border-gray-100 dark:border-white/10 pb-3 cursor-pointer lg:cursor-default"
      role="button"
      tabindex="0"
      :aria-expanded="!collapsed"
      :aria-label="collapsed ? $t('expand') : $t('collapse')"
      @click="toggleCollapsed"
      @keydown.enter.space.prevent="toggleCollapsed"
    >
      <div class="flex items-center">
        <i class="fas fa-calendar-day text-gray-600 dark:text-[var(--text-secondary)] text-sm mr-2" />
        <h3 class="text-sm font-semibold text-gray-900 dark:text-[var(--text-primary)]">
          {{ $t('upcomingHolidays') }}
        </h3>
      </div>
      <i
        class="fas fa-chevron-down text-gray-400 dark:text-[var(--text-secondary)] text-xs transition-transform lg:hidden"
        :class="{ 'rotate-180': !collapsed }"
      />
    </div>

    <div
      v-show="!collapsed"
      class="lg:!block"
    >
      <div
        v-if="loading"
        class="min-h-24"
      >
        <TableSkeleton />
      </div>

      <div
        v-else-if="holidays.length > 0"
        class="space-y-3"
      >
        <div
          v-for="holiday in holidays"
          :key="holiday.id"
          class="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-white/5 -mx-2 px-2 py-2 rounded transition-colors"
        >
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            :style="{ backgroundColor: holiday.color || '#3B82F6' }"
          >
            <i class="fas fa-gift text-white text-xs" />
          </div>
          <div class="flex-1 min-w-0">
            <div
              class="text-sm font-medium text-gray-900 dark:text-[var(--text-primary)] cursor-pointer"
              :class="expandedNameId === holiday.id ? 'whitespace-normal break-words' : 'truncate'"
              :title="expandedNameId === holiday.id ? '' : (holiday.name || '')"
              role="button"
              tabindex="0"
              @click.stop="toggleHolidayName(holiday.id)"
              @keydown.enter.space.prevent.stop="toggleHolidayName(holiday.id)"
            >
              {{ holiday.name }}
            </div>
            <div class="text-xs text-gray-500 dark:text-[var(--text-secondary)]">
              {{ holiday.dateFormatted }}
            </div>
          </div>
        </div>
      </div>

      <div
        v-else
        class="text-sm text-gray-500 dark:text-[var(--text-secondary)] text-center py-3"
      >
        <p>{{ $t('noUpcomingHolidays') }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import 'dayjs/locale/en';
import 'dayjs/locale/tk';
import { formatHolidayDateRange, resolveHolidayOccurrence } from '@/utils/holidayDateDisplay';

export default {
  name: 'HolidaysWidget',
  components: { TableSkeleton },
  data() {
    return {
      holidays: [],
      loading: false,
      collapsed: false,
      expandedNameId: null,
    };
  },
  async mounted() {
    await this.fetchHolidays();
  },
  methods: {
    toggleCollapsed() {
      if (window.innerWidth >= 1024) {
        return;
      }
      this.collapsed = !this.collapsed;
    },
    toggleHolidayName(id) {
      this.expandedNameId = this.expandedNameId === id ? null : id;
    },
    async fetchHolidays() {
      this.loading = true;
      try {
        const holidays = await this.$store.dispatch('loadCompanyHolidays');
        const now = dayjs();
        const locale = this.$i18n.locale || 'ru';
        dayjs.locale(locale);

        const mapped = (holidays || []).map((holiday) => {
          const { start, end } = resolveHolidayOccurrence(holiday, now);

          return {
            ...holiday,
            occurrenceStart: start,
            occurrenceEnd: end,
            dateFormatted: formatHolidayDateRange(start, end, locale),
            daysUntil: start.diff(now, 'day'),
          };
        });

        this.holidays = mapped
          .filter((holiday) => !holiday.occurrenceEnd.isBefore(now, 'day'))
          .sort((a, b) => a.occurrenceStart.diff(b.occurrenceStart))
          .slice(0, 3);
      } catch (error) {
        console.error('Ошибка загрузки праздников:', error);
        this.holidays = [];
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>
