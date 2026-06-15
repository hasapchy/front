<template>
  <div
    v-if="state"
    class="task-deadline-block"
    :class="[toneClass, { 'task-deadline-block--compact': compact }]"
    :title="fullTitle"
  >
    <i
      class="fas fa-calendar-check task-deadline-block__icon"
      aria-hidden="true"
    />
    <span class="task-deadline-block__datetime">
      <span class="task-deadline-block__date">{{ state.dateLabel }}</span>
      <span class="task-deadline-block__sep">·</span>
      <span class="task-deadline-block__time">{{ state.timeLabel }}</span>
    </span>
    <span
      v-if="state.relativeLabel && !compact"
      class="task-deadline-block__relative"
    >{{ state.relativeLabel }}</span>
  </div>
</template>

<script>
import { isTaskDeadlineActive, resolveTaskDeadlineState } from '@/utils/taskDeadlineUtils';

export default {
    name: 'TaskDeadlineBlock',
    props: {
        item: {
            type: Object,
            required: true,
        },
        deadlineField: {
            type: String,
            default: 'deadline',
        },
        compact: {
            type: Boolean,
            default: false,
        },
    },
    computed: {
        deadline() {
            return this.item?.[this.deadlineField] ?? null;
        },
        state() {
            return resolveTaskDeadlineState(this.deadline, {
                active: isTaskDeadlineActive(this.item),
                t: this.$t.bind(this),
            });
        },
        toneClass() {
            if (this.state?.tone === 'danger') {
                return 'task-deadline-block--danger';
            }
            if (this.state?.tone === 'warning') {
                return 'task-deadline-block--warning';
            }
            return '';
        },
        fullTitle() {
            if (!this.state) {
                return '';
            }
            const relative = this.state.relativeLabel ? ` — ${this.state.relativeLabel}` : '';
            return `${this.$t('deadline')}: ${this.state.dateLabel} ${this.state.timeLabel}${relative}`;
        },
    },
};
</script>
