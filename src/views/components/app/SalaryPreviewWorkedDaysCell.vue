<template>
  <button
    v-if="clickable"
    type="button"
    class="text-xs text-left underline cursor-pointer bg-transparent border-0 p-0 text-[#337AB7]"
    style="font: inherit"
    @click.stop="onOpen"
  >
    {{ displayText }}
  </button>
  <span
    v-else
    class="text-xs"
  >{{ displayText }}</span>
</template>

<script>
export default {
    name: 'SalaryPreviewWorkedDaysCell',
    props: {
        worked: {
            type: [Number, String],
            default: null,
        },
        breakdown: {
            type: Object,
            default: null,
        },
        onOpen: {
            type: Function,
            required: true,
        },
    },
    computed: {
        displayText() {
            const v = this.worked;
            if (v == null || v === '') {
                return '—';
            }
            return String(v);
        },
        clickable() {
            const b = this.breakdown;
            if (!b) {
                return false;
            }
            if (b.employment_differs_from_month) {
                return true;
            }
            return b.leave_periods.length > 0;
        },
    },
};
</script>
