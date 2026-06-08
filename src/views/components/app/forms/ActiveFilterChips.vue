<template>
  <div
    v-if="chips.length"
    class="flex flex-wrap items-center gap-1.5 px-1"
    role="list"
    :aria-label="$t('activeFilters')"
  >
    <span
      v-for="chip in chips"
      :key="chip.key"
      role="listitem"
      class="inline-flex max-w-full items-center gap-1 rounded-full border border-[color-mix(in_srgb,var(--nav-accent)_35%,var(--border-subtle))] bg-[color-mix(in_srgb,var(--nav-accent)_10%,var(--surface-muted))] px-2 py-0.5 text-[11px] leading-tight text-[var(--text-primary)] dark:bg-[color-mix(in_srgb,var(--nav-accent)_18%,var(--surface-elevated))]"
    >
      <span class="truncate">
        <span class="font-medium text-[var(--nav-accent)]">{{ chip.label }}:</span>
        {{ chip.value }}
      </span>
      <button
        type="button"
        class="inline-flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[color-mix(in_srgb,var(--nav-accent)_15%,transparent)] hover:text-[var(--color-danger)]"
        :aria-label="$t('removeFilterChip', { filter: `${chip.label}: ${chip.value}` })"
        @click="$emit('remove', chip.key)"
      >
        <i
          class="fas fa-times text-[9px]"
          aria-hidden="true"
        />
      </button>
    </span>
  </div>
</template>

<script>
export default {
  name: 'ActiveFilterChips',
  props: {
    chips: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['remove'],
};
</script>
