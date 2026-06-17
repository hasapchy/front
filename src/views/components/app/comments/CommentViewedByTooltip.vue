<template>
  <div
    ref="root"
    class="relative inline-flex items-center"
    @mouseenter="onHoverStart"
    @mouseleave="onHoverEnd"
  >
    <button
      type="button"
      class="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--surface-muted)] hover:text-[var(--nav-accent)] dark:hover:text-[var(--label-accent)]"
      :class="{ 'bg-[var(--surface-muted)] text-[var(--nav-accent)] dark:text-[var(--label-accent)]': visible && trigger === 'click' }"
      :title="resolvedTitle"
      @click.stop="onTriggerClick"
    >
      <i class="fas" :class="icon" />
    </button>
    <div
      v-if="visible"
      class="absolute right-0 top-6 z-30 min-w-[220px] rounded-md border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-2 text-xs text-[var(--text-primary)] shadow-lg"
      @click.stop
    >
      <div class="mb-1 font-semibold text-[var(--text-primary)]">
        {{ resolvedTitle }}
      </div>
      <template v-if="rows.length">
        <div
          v-for="viewer in rows"
          :key="`${viewer.userId}_${viewer.viewedAt}`"
          class="flex items-center justify-between gap-3 py-0.5"
        >
          <span class="min-w-0 truncate">{{ viewer.name }}</span>
          <span class="shrink-0 tabular-nums text-[var(--text-secondary)]">{{ viewer.viewedAt }}</span>
        </div>
      </template>
      <div
        v-else
        class="text-[var(--text-secondary)]"
      >
        {{ resolvedEmptyText }}
      </div>
    </div>
  </div>
</template>

<script>
import { dtoDateFormatters } from '@/utils/dateUtils';

export default {
  name: 'CommentViewedByTooltip',
  props: {
    viewedBy: {
      type: Array,
      default: () => [],
    },
    visible: {
      type: Boolean,
      default: false,
    },
    trigger: {
      type: String,
      default: 'hover',
      validator: (value) => ['hover', 'click'].includes(value),
    },
    title: {
      type: String,
      default: '',
    },
    emptyText: {
      type: String,
      default: '',
    },
    icon: {
      type: String,
      default: 'fa-eye',
    },
  },
  emits: ['hover-start', 'hover-end', 'toggle'],
  computed: {
    resolvedTitle() {
      return this.title || this.$t('timelineViewedBy');
    },
    resolvedEmptyText() {
      return this.emptyText || this.$t('timelineNoViewsYet');
    },
    rows() {
      return (this.viewedBy || []).map((row) => ({
        userId: row?.user_id || row?.userId || 0,
        name: row?.name || this.$t('timelineUnknownViewer'),
        viewedAt: row?.viewedAt || row?.viewed_at
          ? dtoDateFormatters.formatDate(row.viewedAt || row.viewed_at)
          : this.$t('timelineUnknownViewer'),
      }));
    },
  },
  watch: {
    visible(val) {
      if (this.trigger !== 'click') return;
      if (val) {
        document.addEventListener('click', this.onDocumentClick);
      } else {
        document.removeEventListener('click', this.onDocumentClick);
      }
    },
  },
  beforeUnmount() {
    document.removeEventListener('click', this.onDocumentClick);
  },
  methods: {
    onHoverStart() {
      if (this.trigger !== 'hover') return;
      this.$emit('hover-start');
    },
    onHoverEnd() {
      if (this.trigger !== 'hover') return;
      this.$emit('hover-end');
    },
    onTriggerClick() {
      if (this.trigger === 'click') {
        this.$emit('toggle');
      }
    },
    onDocumentClick(event) {
      if (this.$refs.root?.contains(event.target)) return;
      this.$emit('hover-end');
    },
  },
};
</script>
