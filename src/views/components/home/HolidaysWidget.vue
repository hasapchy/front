<template>
  <div class="bg-white dark:bg-[var(--surface-elevated)] rounded-lg shadow-sm border border-gray-200 dark:border-white/10 p-4 hover:shadow dark:hover:shadow-none transition-shadow duration-200">
    <div class="flex items-center mb-3 border-b border-gray-100 dark:border-white/10 pb-3">
      <i class="fas fa-calendar-day text-gray-600 dark:text-[var(--text-secondary)] text-sm mr-2 shrink-0" />
      <h3 class="text-sm font-semibold text-gray-900 dark:text-[var(--text-primary)] truncate">
        {{ $t('upcomingHolidays') }}
      </h3>
    </div>

    <div>
      <div
        v-if="loading"
        class="min-h-24"
      >
        <TableSkeleton />
      </div>

      <div
        v-else-if="previewEvents.length > 0"
        class="space-y-3"
      >
        <div
          v-for="holiday in previewEvents"
          :key="holiday.id"
          class="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-white/5 -mx-2 px-2 py-2 rounded transition-colors"
        >
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            :style="{ backgroundColor: holiday.color || '#3B82F6' }"
          >
            <i :class="[holiday.icon, 'text-white text-xs']" />
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
        <button
          v-if="hasMoreEvents"
          type="button"
          class="w-full text-center text-xs font-medium text-[#337AB7] dark:text-[var(--label-accent)] hover:underline pt-1"
          @click="openAllModal"
        >
          {{ $t('viewAll') }} ({{ allEvents.length }})
        </button>
      </div>

      <div
        v-else
        class="text-sm text-gray-500 dark:text-[var(--text-secondary)] text-center py-3"
      >
        <p>{{ $t('noUpcomingHolidays') }}</p>
      </div>
    </div>

    <FiltersModal
      :show="allModalOpen"
      :title="$t('upcomingHolidays')"
      footer-mode="none"
      scrollable-body
      panel-class="md:min-w-[960px] md:max-w-[96rem]"
      @close="allModalOpen = false"
    >
      <div class="divide-y divide-gray-100 dark:divide-[var(--border-subtle)]">
        <div
          v-for="holiday in allEvents"
          :key="`modal-${holiday.id}`"
          class="flex items-center gap-2 px-2 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
        >
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            :style="{ backgroundColor: holiday.color || '#3B82F6' }"
          >
            <i :class="[holiday.icon, 'text-white text-xs']" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-gray-900 dark:text-[var(--text-primary)] break-words">
              {{ holiday.name }}
            </div>
            <div class="text-xs text-gray-500 dark:text-[var(--text-secondary)]">
              {{ holiday.dateFormatted }}
            </div>
          </div>
        </div>
      </div>
    </FiltersModal>
  </div>
</template>

<script>
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import FiltersModal from '@/views/components/app/forms/FiltersModal.vue';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import 'dayjs/locale/en';
import 'dayjs/locale/tk';
import { formatHolidayDateRange, resolveHolidayOccurrence } from '@/utils/holidayDateDisplay';
const PREVIEW_LIMIT = 3;

export default {
  name: 'HolidaysWidget',
  components: { TableSkeleton, FiltersModal },
  data() {
    return {
      allEvents: [],
      loading: false,
      expandedNameId: null,
      allModalOpen: false,
      previewLimit: PREVIEW_LIMIT,
    };
  },
  computed: {
    previewEvents() {
      return this.allEvents.slice(0, this.previewLimit);
    },
    hasMoreEvents() {
      return this.allEvents.length > this.previewLimit;
    },
  },
  async mounted() {
    await this.fetchHolidays();
  },
  methods: {
    toggleHolidayName(id) {
      this.expandedNameId = this.expandedNameId === id ? null : id;
    },
    openAllModal() {
      if (this.allEvents.length === 0) {
        return;
      }
      this.allModalOpen = true;
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

        this.allEvents = mapped
          .filter((holiday) => !holiday.occurrenceEnd.isBefore(now, 'day'))
          .sort((a, b) => a.occurrenceStart.diff(b.occurrenceStart));
      } catch (error) {
        console.error('Ошибка загрузки событий:', error);
        this.allEvents = [];
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>
