<template>
  <div
    v-if="hasValue"
    class="card-date-block"
    :title="resolvedTitle"
  >
    <span class="card-date-block__month">{{ month }}</span>
    <span class="card-date-block__day">{{ day }}</span>
    <span
      v-if="showTime"
      class="card-date-block__time"
    >{{ time }}</span>
  </div>
</template>

<script>
import dayjs from 'dayjs';
import { parseCardDateParts } from '@/utils/cardDateUtils';
import { formatDateByDisplayMode, normalizeDateDisplayMode, toDayjsLocale } from '@/utils/dateUtils';

export default {
    name: 'CardDateBlock',
    props: {
        date: {
            type: [String, Date, Number],
            default: null,
        },
        fieldType: {
            type: String,
            default: 'datetime',
        },
        displayMode: {
            type: String,
            default: null,
        },
        title: {
            type: String,
            default: '',
        },
    },
    computed: {
        resolvedMode() {
            return normalizeDateDisplayMode(this.fieldType, this.displayMode);
        },
        parts() {
            const locale = this.$i18n?.locale || 'ru';
            return parseCardDateParts(this.date, locale);
        },
        month() {
            return this.parts.month;
        },
        day() {
            return this.parts.day;
        },
        showTime() {
            return this.resolvedMode === 'datetime' && Boolean(this.time);
        },
        time() {
            if (!this.date) {
                return '';
            }
            const parsed = dayjs(this.date).locale(toDayjsLocale(this.$i18n?.locale || 'ru'));
            if (!parsed.isValid()) {
                return '';
            }
            return parsed.format('HH:mm');
        },
        hasValue() {
            return Boolean(this.month && this.day);
        },
        resolvedTitle() {
            const formatted = formatDateByDisplayMode(this.date, this.fieldType, this.displayMode);
            return formatted || this.title;
        },
    },
};
</script>
