<template>
  <div class="work-schedule-editor">
    <div class="mb-4 rounded border border-gray-200 bg-white p-4 dark:border-[var(--border-subtle)] dark:bg-[var(--surface-elevated)]">
      <h3 class="text-md mb-3 font-semibold text-gray-900 dark:text-[var(--text-primary)]">
        {{ $t('workSchedule') }}
      </h3>

      <div class="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          class="rounded bg-[var(--nav-accent)] px-3 py-1.5 text-sm text-white transition-colors hover:brightness-110 dark:bg-[var(--nav-accent)] dark:hover:bg-[var(--nav-accent)]"
          @click="applyToAll"
        >
          {{ $t('applyToAllDays') }}
        </button>
        <button
          type="button"
          class="rounded bg-gray-500 px-3 py-1.5 text-sm text-white transition-colors hover:bg-gray-600 dark:bg-[var(--surface-muted)] dark:text-[var(--text-primary)] dark:hover:bg-[#5c6773]"
          @click="resetToDefault"
        >
          {{ $t('resetToDefault') }}
        </button>
      </div>
      <div class="overflow-x-auto">
        <table
          class="min-w-full rounded bg-white shadow-sm dark:bg-[var(--surface-elevated)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.35)]"
          style="font-size: 12px;"
        >
          <thead class="rounded-t-sm bg-gray-100 dark:bg-[var(--surface-muted)]">
            <tr>
              <th class="border border-gray-300 px-3 py-2 text-left font-medium text-gray-900 dark:border-[var(--border-subtle)] dark:text-[var(--text-primary)]">
                {{ $t('day') }}
              </th>
              <th class="border border-gray-300 px-3 py-2 text-center font-medium text-gray-900 dark:border-[var(--border-subtle)] dark:text-[var(--text-primary)]">
                {{ $t('working') }}
              </th>
              <th class="border border-gray-300 px-3 py-2 text-left font-medium text-gray-900 dark:border-[var(--border-subtle)] dark:text-[var(--text-primary)]">
                {{ $t('startTime') }}
              </th>
              <th class="border border-gray-300 px-3 py-2 text-left font-medium text-gray-900 dark:border-[var(--border-subtle)] dark:text-[var(--text-primary)]">
                {{ $t('endTime') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(day, dayKey) in schedule"
              :key="dayKey"
              class="border-b border-gray-300 transition-colors hover:bg-gray-50 dark:border-[var(--border-subtle)] dark:hover:bg-[var(--surface-muted)]"
            >
              <td class="border-x border-gray-300 px-3 py-2 font-medium text-gray-900 dark:border-[var(--border-subtle)] dark:text-[var(--text-primary)]">
                {{ getDayName(dayKey) }}
              </td>
              <td class="border-x border-gray-300 px-3 py-2 text-center dark:border-[var(--border-subtle)]">
                <input
                  v-model="schedule[dayKey].enabled"
                  type="checkbox"
                  class="schedule-checkbox cursor-pointer"
                >
              </td>
              <td class="border-x border-gray-300 px-3 py-2 dark:border-[var(--border-subtle)]">
                <input
                  v-model="schedule[dayKey].start"
                  type="time"
                  :disabled="!schedule[dayKey].enabled"
                  class="w-full rounded border border-gray-300 bg-[var(--input-bg)] px-2 py-1 text-gray-900 dark:border-[var(--input-border)] dark:text-[var(--text-primary)]"
                  :class="{ 'cursor-not-allowed bg-gray-100 dark:bg-[var(--surface-muted)] dark:text-[var(--text-secondary)]': !schedule[dayKey].enabled }"
                >
              </td>
              <td class="border-x border-gray-300 px-3 py-2 dark:border-[var(--border-subtle)]">
                <input
                  v-model="schedule[dayKey].end"
                  type="time"
                  :disabled="!schedule[dayKey].enabled"
                  class="w-full rounded border border-gray-300 bg-[var(--input-bg)] px-2 py-1 text-gray-900 dark:border-[var(--input-border)] dark:text-[var(--text-primary)]"
                  :class="{ 'cursor-not-allowed bg-gray-100 dark:bg-[var(--surface-muted)] dark:text-[var(--text-secondary)]': !schedule[dayKey].enabled }"
                >
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import {
  cloneDefaultWorkSchedule,
  cloneWorkSchedule,
  schedulesEqual,
} from '@/constants/defaultWorkSchedule';

export default {
  name: 'WorkScheduleEditor',
  props: {
    modelValue: {
      type: Object,
      required: true,
    },
  },
  emits: ['update:modelValue'],
  data() {
    return {
      schedule: cloneDefaultWorkSchedule(),
      syncing: false,
    };
  },
  watch: {
    modelValue: {
      immediate: true,
      deep: true,
      handler(value) {
        if (this.syncing) {
          return;
        }
        this.schedule = cloneWorkSchedule(value);
      },
    },
    schedule: {
      deep: true,
      handler(value) {
        if (this.syncing || schedulesEqual(value, this.modelValue)) {
          return;
        }
        this.syncing = true;
        this.$emit('update:modelValue', cloneWorkSchedule(value));
        this.$nextTick(() => {
          this.syncing = false;
        });
      },
    },
  },
  methods: {
    getDayName(dayKey) {
      const days = {
        1: this.$t('1'),
        2: this.$t('2'),
        3: this.$t('3'),
        4: this.$t('4'),
        5: this.$t('5'),
        6: this.$t('6'),
        7: this.$t('7'),
      };
      return days[dayKey] || dayKey;
    },
    applyToAll() {
      const template = { ...this.schedule[1] };
      for (let d = 1; d <= 7; d++) {
        this.schedule[d] = { ...template };
      }
    },
    resetToDefault() {
      this.schedule = cloneDefaultWorkSchedule();
    },
  },
};
</script>

<style scoped>
.work-schedule-editor {
  width: 100%;
}

input[type="time"]:disabled {
  opacity: 0.6;
}

.schedule-checkbox {
  accent-color: var(--nav-accent);
}
</style>
