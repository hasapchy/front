<template>
  <button
    type="button"
    class="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--nav-accent)_35%,var(--border-subtle))] bg-[color-mix(in_srgb,var(--nav-accent)_10%,var(--surface-muted))] px-3 py-1 text-xs leading-tight text-[var(--text-primary)] transition-colors hover:bg-[color-mix(in_srgb,var(--nav-accent)_18%,var(--surface-muted))] dark:bg-[color-mix(in_srgb,var(--nav-accent)_18%,var(--surface-elevated))]"
    @click="$emit('click')"
  >
    <i
      :class="icon"
      class="shrink-0 text-[10px] text-[var(--label-accent)]"
      aria-hidden="true"
    />
    <span class="truncate font-medium">{{ label }}</span>
    <span
      v-if="badge"
      class="shrink-0 rounded-full bg-[color-mix(in_srgb,var(--nav-accent)_22%,var(--surface-muted))] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--label-accent)]"
    >
      {{ badge }}
    </span>
  </button>
</template>

<script>
export default {
    name: 'TaskFormSectionChip',
    props: {
        icon: {
            type: String,
            required: true,
        },
        label: {
            type: String,
            required: true,
        },
        badge: {
            type: String,
            default: '',
        },
    },
    emits: ['click'],
};
</script>
