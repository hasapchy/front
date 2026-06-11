<template>
  <div>
    <div
      v-if="showToolbar"
      class="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white p-3 shadow-md dark:bg-[var(--surface-elevated)] dark:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.35)]"
    >
      <div class="flex flex-wrap items-center gap-2">
        <div class="shimmer-block h-9 w-9 shrink-0 rounded" />
        <div class="shimmer-block h-9 w-20 shrink-0 rounded" />
        <div class="shimmer-block h-9 w-24 shrink-0 rounded" />
      </div>
      <div class="flex items-center gap-2">
        <div class="shimmer-block h-8 w-24 rounded" />
        <div class="shimmer-block h-9 w-9 rounded" />
      </div>
    </div>
    <div :class="gridClass">
      <div
        v-for="i in count"
        :key="i"
        :class="cardShellClass"
      >
        <template v-if="isEntityLayout">
          <div class="entity-card-skeleton__accent shimmer-block" />
          <div class="entity-card-shell entity-card-shell--checkbox">
            <div class="shimmer-block entity-card-skeleton__checkbox" />
            <div class="entity-card-shell__header">
              <div class="entity-card__hero w-full">
                <div class="entity-card__hero-head min-w-0 flex-1">
                  <div class="entity-card__title-row">
                    <div class="shimmer-block entity-card-skeleton__title" />
                    <div class="shimmer-block entity-card-skeleton__subtitle" />
                  </div>
                </div>
              </div>
            </div>
            <div class="entity-card-shell__body">
              <div class="shimmer-block entity-card-skeleton__hero-line" />
              <div class="entity-card__footer entity-card-skeleton__footer">
                <div class="entity-card__footer-start">
                  <div class="shimmer-block entity-card-skeleton__date" />
                </div>
                <div class="entity-card__footer-center">
                  <div class="shimmer-block entity-card-skeleton__pill" />
                </div>
                <div class="entity-card__footer-end">
                  <div class="shimmer-block entity-card-skeleton__amount" />
                </div>
              </div>
            </div>
          </div>
        </template>
        <template v-else>
          <div class="flex items-start gap-2">
            <div class="shimmer-block h-4 w-4 shrink-0 rounded" />
            <div class="shimmer-block h-4 min-w-0 flex-1 rounded" />
          </div>
          <div class="mt-3 space-y-2">
            <div class="shimmer-block h-3.5 w-full rounded" />
            <div class="shimmer-block h-3.5 w-[80%] rounded" />
          </div>
          <div class="mt-auto flex items-center justify-between gap-2 border-t border-gray-100 pt-2 dark:border-[var(--border-subtle)]">
            <div class="shimmer-block h-3.5 w-16 rounded" />
            <div class="shimmer-block h-3.5 w-14 shrink-0 rounded" />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
export default {
    name: 'CardsSkeleton',
    props: {
        layout: {
            type: String,
            default: 'list',
            validator: (value) => ['entity', 'list'].includes(value),
        },
        count: {
            type: Number,
            default: 20,
        },
        showToolbar: {
            type: Boolean,
            default: true,
        },
    },
    computed: {
        isEntityLayout() {
            return this.layout === 'entity';
        },
        gridClass() {
            if (this.isEntityLayout) {
                return 'grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6';
            }
            return 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
        },
        cardShellClass() {
            const base = 'flex min-h-[120px] flex-col rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-[var(--border-subtle)] dark:bg-[var(--surface-elevated)]';
            if (this.isEntityLayout) {
                return `${base} entity-card-skeleton relative`;
            }
            return `${base} mapper-card min-h-[140px] dark:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.3)]`;
        },
    },
};
</script>

<style scoped>
.shimmer-block {
    background: linear-gradient(
        90deg,
        #e5e7eb 0%,
        #f3f4f6 20%,
        #e5e7eb 40%,
        #e5e7eb 100%
    );
    background-size: 200% 100%;
    animation: cards-shimmer 1.5s ease-in-out infinite;
}

@keyframes cards-shimmer {
    0% {
        background-position: 200% 0;
    }
    100% {
        background-position: -200% 0;
    }
}
</style>
