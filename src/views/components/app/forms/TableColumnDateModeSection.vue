<template>
  <div
    v-if="items.length"
    class="mb-2 border-b border-gray-200 pb-2 dark:border-[var(--border-subtle)]"
  >
    <TableDateDisplayModeHint />
    <div
      v-for="item in items"
      :key="`date-mode-${item.column.name}`"
      class="mb-1 rounded bg-gray-50 px-2 py-1.5 dark:bg-[var(--surface-muted)]"
    >
      <span
        v-if="showColumnLabel"
        class="mb-1 block truncate text-xs"
      >
        {{ resolveColumnLabel(item.column) }}
      </span>
      <div class="flex w-full items-center gap-1">
        <button
          type="button"
          class="flex-1 rounded border px-2 py-1 text-[10px] font-medium"
          :class="resolveMode(item.column) === 'date'
            ? 'border-[var(--nav-accent)] bg-[var(--nav-accent)] text-white'
            : 'border-gray-200 bg-white text-[var(--text-primary)] dark:border-[var(--border-subtle)] dark:bg-[var(--surface-elevated)]'"
          @click.stop="$emit('set-mode', item, 'date')"
        >
          {{ $t('dateOnly') }}
        </button>
        <button
          type="button"
          class="flex-1 rounded border px-2 py-1 text-[10px] font-medium"
          :class="resolveMode(item.column) === 'datetime'
            ? 'border-[var(--nav-accent)] bg-[var(--nav-accent)] text-white'
            : 'border-gray-200 bg-white text-[var(--text-primary)] dark:border-[var(--border-subtle)] dark:bg-[var(--surface-elevated)]'"
          @click.stop="$emit('set-mode', item, 'datetime')"
        >
          {{ $t('dateTime') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import TableDateDisplayModeHint from '@/views/components/app/forms/TableDateDisplayModeHint.vue';

export default {
  name: 'TableColumnDateModeSection',
  components: { TableDateDisplayModeHint },
  props: {
    items: {
      type: Array,
      default: () => [],
    },
    resolveMode: {
      type: Function,
      required: true,
    },
    showColumnLabel: {
      type: Boolean,
      default: false,
    },
    columnLabelFn: {
      type: Function,
      default: null,
    },
  },
  emits: ['set-mode'],
  methods: {
    resolveColumnLabel(column) {
      if (this.columnLabelFn) {
        return this.columnLabelFn(column.label);
      }
      return this.$te(column.label) ? this.$t(column.label) : column.label;
    },
  },
};
</script>
