<template>
  <div
    v-if="hasValue"
    class="card-date-block"
    :title="title"
  >
    <span class="card-date-block__month">{{ month }}</span>
    <span class="card-date-block__day">{{ day }}</span>
  </div>
</template>

<script>
import { parseCardDateParts } from '@/utils/cardDateUtils';

export default {
    name: 'CardDateBlock',
    props: {
        date: {
            type: [String, Date, Number],
            default: null,
        },
        title: {
            type: String,
            default: '',
        },
    },
    computed: {
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
        hasValue() {
            return Boolean(this.month && this.day);
        },
    },
};
</script>
