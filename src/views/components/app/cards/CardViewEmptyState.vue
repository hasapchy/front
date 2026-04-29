<template>
  <div class="rounded-xl border border-dashed border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--surface-muted)_88%,var(--surface-page))] px-6 py-14 text-center">
    <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface-elevated)] text-[var(--text-secondary)] shadow-sm">
      <i class="fas fa-layer-group text-xl" />
    </div>
    <p class="text-base font-semibold text-[var(--text-primary)]">
      {{ displayTitle }}
    </p>
    <p class="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--text-secondary)]">
      {{ displayHint }}
    </p>
  </div>
</template>

<script>
export default {
  name: 'CardViewEmptyState',
  props: {
    title: {
      type: String,
      default: ''
    },
    hint: {
      type: String,
      default: ''
    }
  },
  computed: {
    displayTitle() {
      return this.title || this.$t('cardViewEmptyTitle');
    },
    displayHint() {
      return this.hint || this.$t('cardViewEmptyHint');
    }
  }
};
</script>
