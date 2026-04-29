<template>
  <div
    class="date-picker-container rounded border border-gray-300 bg-white p-4 shadow-lg dark:border-[var(--border-subtle)] dark:bg-[var(--surface-elevated)]"
    style="min-width: 600px;"
  >
    <div class="flex gap-4">
      <div class="flex-1">
        <div class="flex items-center justify-between mb-4">
          <button 
            class="px-2 py-1 text-gray-600 hover:text-gray-800 dark:text-[var(--text-secondary)] dark:hover:text-[var(--text-primary)]" 
            type="button"
            @click="previousMonth"
          >
            <i class="fas fa-chevron-left" />
          </button>
          <h3 class="text-lg font-semibold text-gray-800 dark:text-[var(--text-primary)]">
            {{ currentMonthName }} {{ currentYear }}
          </h3>
          <button 
            class="px-2 py-1 text-gray-600 hover:text-gray-800 dark:text-[var(--text-secondary)] dark:hover:text-[var(--text-primary)]" 
            type="button"
            @click="nextMonth"
          >
            <i class="fas fa-chevron-right" />
          </button>
        </div>

        <div class="grid grid-cols-7 gap-1 mb-2">
          <div 
            v-for="day in weekDays" 
            :key="day" 
            class="py-1 text-center text-sm font-medium text-gray-600 dark:text-[var(--text-secondary)]"
          >
            {{ day }}
          </div>
        </div>

        <div class="grid grid-cols-7 gap-1">
          <button
            v-for="(date, index) in calendarDays"
            :key="index"
            :class="[
              'date-cell py-2 px-1 text-sm rounded transition-colors',
              {
                'text-gray-400 dark:text-[var(--text-secondary)]': date.isOtherMonth,
                'text-gray-800 dark:text-[var(--text-primary)]': !date.isOtherMonth && !date.isToday && !date.isWeekend && !date.isSelected && !date.isDayDisabled,
                'font-semibold text-red-600 dark:text-red-400': !date.isOtherMonth && date.isWeekend && !date.isSelected && !date.isDayDisabled,
                'bg-blue-200 font-semibold text-blue-800 dark:bg-blue-900/50 dark:text-blue-200': date.isToday && !date.isDayDisabled,
                'bg-blue-100 text-blue-800 dark:bg-blue-950/45 dark:text-blue-200': date.isSelected && !date.isToday,
                'bg-blue-100 text-red-600 dark:bg-blue-950/45 dark:text-red-400': date.isSelected && !date.isToday && date.isWeekend,
                'hover:bg-gray-100 dark:hover:bg-[var(--surface-muted)]': !date.isSelected && !date.isToday && !date.isDayDisabled,
                'opacity-50 cursor-not-allowed': date.isDayDisabled
              }
            ]"
            type="button"
            @click="!date.isDayDisabled && selectDate(date)"
          >
            {{ date.day }}
          </button>
        </div>

        <div
          v-if="type === 'datetime'"
          class="mt-4 border-t border-gray-200 pt-4 dark:border-[var(--border-subtle)]"
        >
          <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-[var(--text-secondary)]">
            {{ $t('time') }}
          </label>
          <div class="flex gap-2">
            <input
              v-model="selectedTime"
              type="time"
              class="flex-1 rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-[var(--border-subtle)] dark:bg-[var(--input-bg)] dark:text-[var(--text-primary)]"
              @change="updateDateTime"
            >
          </div>
        </div>
      </div>

      <div class="w-64 border-l border-gray-200 pl-4 dark:border-[var(--border-subtle)]">
        <h4 class="mb-3 text-sm font-semibold text-gray-700 dark:text-[var(--text-secondary)]">
          {{ $t('quickSelect') }}
        </h4>
        <div class="space-y-2">
          <button
            v-for="option in quickSelectOptions"
            :key="option.key"
            :class="[
              'w-full text-left px-3 py-2 rounded border transition-colors',
              option.isSelected 
                ? 'border-blue-300 bg-blue-100 text-blue-800 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-200' 
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-[var(--border-subtle)] dark:bg-[var(--surface-elevated)] dark:text-[var(--text-primary)] dark:hover:bg-[var(--surface-muted)]'
            ]"
            type="button"
            @click="selectQuickDate(option.key)"
          >
            <div class="font-medium text-sm">
              {{ option.label }}
            </div>
            <div class="mt-1 text-xs text-gray-500 dark:text-[var(--text-secondary)]">
              {{ option.dateText }}
            </div>
          </button>
        </div>
      </div>
    </div>
    <div
      v-if="clearable"
      class="mt-2 flex gap-2"
    >
      <button
        v-if="clearable"
        type="button"
        class="flex-1 rounded border border-gray-200 px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-800 dark:border-[var(--border-subtle)] dark:bg-[var(--surface-elevated)] dark:text-[var(--text-secondary)] dark:hover:bg-[var(--surface-muted)] dark:hover:text-[var(--text-primary)]"
        @click="clearDate"
      >
        {{ $t('noDeadline') }}
      </button>
    </div>
  </div>
</template>

<script>
import dayjs from 'dayjs';
import localeData from 'dayjs/plugin/localeData';
import { dateFormMixin, getScheduleDayKeyFromDayjsDay, formatDatePickerLabel, toDayjsLocale, getLastWorkDayDayjs } from '@/utils/dateUtils';

dayjs.extend(localeData);

const CALENDAR_DAYS_COUNT = 42;

function buildQuickSelectOptions(t, formatLabel, lastWorkDayDayjs) {
    const today = dayjs();
    const yesterday = today.subtract(1, 'day');
    const tomorrow = today.add(1, 'day');
    const currentDay = today.day();
    const lastDay = lastWorkDayDayjs ?? 5;
    const endOfWeek = (currentDay === 0 || currentDay > lastDay)
        ? today.add(1, 'week').day(lastDay)
        : today.day(lastDay);
    return [
        { key: 'yesterday', label: t('yesterday'), date: yesterday, dateText: formatLabel(yesterday) },
        { key: 'today', label: t('today'), date: today, dateText: formatLabel(today) },
        { key: 'tomorrow', label: t('tomorrow'), date: tomorrow, dateText: formatLabel(tomorrow) },
        { key: 'nextWeek', label: t('nextWeek'), date: today.add(7, 'day'), dateText: formatLabel(today.add(7, 'day')) },
        { key: 'endOfWeek', label: t('endOfWeek'), date: endOfWeek, dateText: formatLabel(endOfWeek) },
        { key: 'endOfMonth', label: t('endOfMonth'), date: today.endOf('month'), dateText: formatLabel(today.endOf('month')) }
    ];
}

export default {
    name: 'DatePicker',
    mixins: [dateFormMixin],
    props: {
        modelValue: {
            type: String,
            default: null
        },
        type: {
            type: String,
            default: 'datetime',
            validator: (v) => ['date', 'datetime'].includes(v)
        },
        minDate: {
            type: String,
            default: null
        },
        workSchedule: {
            type: Object,
            default: null
        },
        restrictToNow: {
            type: Boolean,
            default: true
        },
        editingItemId: {
            type: [Number, String],
            default: null
        },
        clearable: {
            type: Boolean,
            default: true
        }
    },
    emits: ['update:modelValue', 'apply', 'clear'],
    data() {
        const today = dayjs();
        const initialDate = this.modelValue ? dayjs(this.modelValue) : today;
        
        return {
            currentMonth: initialDate.month(),
            currentYear: initialDate.year(),
            selectedDate: initialDate,
            selectedTime: initialDate.format('HH:mm')
        };
    },
    computed: {
        isDisabled() {
            return !!this.editingItemId && !this.canEditDate();
        },
        effectiveWorkSchedule() {
            return this.workSchedule ?? this.$store.getters?.currentCompany?.workSchedule ?? null;
        },
        effectiveMaxDate() {
            if (!this.restrictToNow) return null;
            if (this.canEditDate()) return null;
            const max = this.getMaxDate();
            return max ? dayjs(max) : null;
        },
        effectiveMinDate() {
            if (this.minDate) {
                const d = dayjs(this.minDate);
                return d.isValid() ? d : null;
            }
            if (this.restrictToNow && !this.canEditDate()) {
                const min = this.getMinDate();
                return min ? dayjs(min) : null;
            }
            return null;
        },
        dayjsLocale() {
            return toDayjsLocale(this.$i18n?.locale);
        },
        currentMonthName() {
            return dayjs().year(this.currentYear).month(this.currentMonth).locale(this.dayjsLocale).format('MMMM');
        },
        weekDays() {
            const ld = dayjs().locale(this.dayjsLocale).localeData();
            const min = ld.weekdaysMin();
            return [min[1], min[2], min[3], min[4], min[5], min[6], min[0]];
        },
        calendarDays() {
            const firstDayOfMonth = dayjs().year(this.currentYear).month(this.currentMonth).date(1);
            const firstDayWeekday = firstDayOfMonth.day();
            const daysToSubtract = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1;
            const startOfCalendar = firstDayOfMonth.subtract(daysToSubtract, 'day');
            
            const days = [];
            const today = dayjs();
            const selectedDateStr = this.selectedDate.format('YYYY-MM-DD');

            for (let i = 0; i < CALENDAR_DAYS_COUNT; i++) {
                const date = startOfCalendar.add(i, 'day');
                const dateStr = date.format('YYYY-MM-DD');
                const isOtherMonth = date.month() !== this.currentMonth;
                const isToday = dateStr === today.format('YYYY-MM-DD');
                
                const scheduleDayKey = getScheduleDayKeyFromDayjsDay(date.day());
                const daySchedule = this.effectiveWorkSchedule?.[scheduleDayKey];
                const isWeekend = this.effectiveWorkSchedule ? !daySchedule?.enabled : false;
                
                const isSelected = dateStr === selectedDateStr;
                const isAfterMax = this.effectiveMaxDate && date.isAfter(this.effectiveMaxDate, 'day');
                const isBeforeMin = this.effectiveMinDate && date.isBefore(this.effectiveMinDate, 'day');
                const isDayDisabled = this.isDisabled || isAfterMax || isBeforeMin;

                days.push({
                    day: date.date(),
                    date: date,
                    dateStr: dateStr,
                    isOtherMonth,
                    isToday,
                    isWeekend,
                    isSelected,
                    isDayDisabled
                });
            }

            return days;
        },
        quickSelectOptions() {
            const locale = this.$i18n?.locale;
            const formatLabel = (d) => formatDatePickerLabel(d, locale);
            const lastWorkDayDayjs = getLastWorkDayDayjs(this.effectiveWorkSchedule);
            const options = buildQuickSelectOptions((key) => this.$t(key), formatLabel, lastWorkDayDayjs);
            const selectedDateStr = this.selectedDate.format('YYYY-MM-DD');
            let result = options.map(opt => ({
                ...opt,
                isSelected: opt.date.format('YYYY-MM-DD') === selectedDateStr
            }));
            if (this.effectiveMaxDate) {
                result = result.filter(opt => opt.date.isBefore(this.effectiveMaxDate, 'day') || opt.date.isSame(this.effectiveMaxDate, 'day'));
            }
            return result;
        }
    },
    watch: {
        modelValue(newValue) {
            if (newValue) {
                const date = dayjs(newValue);
                this.selectedDate = date;
                this.selectedTime = date.format('HH:mm');
                this.currentMonth = date.month();
                this.currentYear = date.year();
            } else {
                const today = dayjs();
                this.currentMonth = today.month();
                this.currentYear = today.year();
                this.selectedDate = today;
                this.selectedTime = today.format('HH:mm');
            }
        },
        isDisabled: {
            immediate: true,
            handler(disabled) {
                if (disabled) {
                    this.$nextTick(() => this.syncToNow());
                }
            }
        }
    },
    mounted() {
        if (this.isDisabled) {
            this.syncToNow();
        }
    },
    methods: {
        selectDate(dateObj) {
            if (this.isDisabled || dateObj.isDayDisabled) return;
            if (dateObj.isOtherMonth) {
                this.currentMonth = dateObj.date.month();
                this.currentYear = dateObj.date.year();
            }
            
            this.selectedDate = dateObj.date;
            
            const scheduleDayKey = getScheduleDayKeyFromDayjsDay(dateObj.date.day());
            const daySchedule = this.effectiveWorkSchedule?.[scheduleDayKey];
            if (daySchedule?.end) {
                this.selectedTime = daySchedule.end;
            }
            
            this.updateDateTime();
            this.$emit('apply');
        },

        clearDate() {
            this.$emit('update:modelValue', '');
            this.$emit('clear');
        },
        applyDate() {
            this.updateDateTime();
            this.$emit('apply');
        },
        selectQuickDate(key) {
            if (this.isDisabled) return;
            const option = this.quickSelectOptions.find(opt => opt.key === key);
            if (!option) return;
            
            this.selectedDate = option.date;
            this.currentMonth = option.date.month();
            this.currentYear = option.date.year();
            
            const scheduleDayKey = getScheduleDayKeyFromDayjsDay(option.date.day());
            const daySchedule = this.effectiveWorkSchedule?.[scheduleDayKey];
            if (daySchedule?.end) {
                this.selectedTime = daySchedule.end;
            }
            
            this.updateDateTime();
            this.$emit('apply');
        },
        updateDateTime() {
            if (this.isDisabled) return;
            const [h, m] = this.selectedTime.split(':');
            const hours = parseInt(h, 10) || 0;
            const minutes = parseInt(m, 10) || 0;
            let dateTime = this.type === 'date'
                ? this.selectedDate.hour(0).minute(0).second(0)
                : this.selectedDate.hour(hours).minute(minutes).second(0);

            if (this.effectiveMinDate && dateTime.isBefore(this.effectiveMinDate)) {
                dateTime = this.effectiveMinDate;
                this.selectedDate = dateTime;
                this.selectedTime = dateTime.format('HH:mm');
            }
            if (this.effectiveMaxDate && dateTime.isAfter(this.effectiveMaxDate)) {
                dateTime = this.effectiveMaxDate;
                this.selectedDate = dateTime;
                this.selectedTime = dateTime.format('HH:mm');
            }

            this.$emit('update:modelValue', this.type === 'date'
                ? dateTime.format('YYYY-MM-DD')
                : dateTime.format('YYYY-MM-DDTHH:mm'));
        },
        syncToNow() {
            const now = this.getCurrentLocalDateTime();
            const value = this.type === 'date' ? now.substring(0, 10) : now;
            this.$emit('update:modelValue', value);
        },
        previousMonth() {
            const newDate = dayjs().year(this.currentYear).month(this.currentMonth).subtract(1, 'month');
            this.currentMonth = newDate.month();
            this.currentYear = newDate.year();
        },
        nextMonth() {
            const newDate = dayjs().year(this.currentYear).month(this.currentMonth).add(1, 'month');
            this.currentMonth = newDate.month();
            this.currentYear = newDate.year();
        }
    }
};
</script>

<style scoped>
.date-picker-container {
    z-index: 1000;
}

.date-cell {
    min-height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.date-cell:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
}
</style>
