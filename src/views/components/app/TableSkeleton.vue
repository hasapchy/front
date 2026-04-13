<template>
  <div class="table-skeleton-wrapper">
    <div class="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white p-3 shadow-sm dark:bg-[var(--surface-elevated)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
      <div class="flex items-center gap-2 flex-wrap">
        <div class="shimmer-block h-9 w-24 rounded" />
        <div class="shimmer-block h-9 w-20 rounded" />
        <div class="shimmer-block h-9 w-16 rounded hidden sm:block" />
      </div>
      <div class="flex items-center gap-2">
        <div class="shimmer-block h-9 w-32 rounded" />
        <div class="shimmer-block h-9 w-9 rounded" />
      </div>
    </div>
    <div class="w-full overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-[var(--border-subtle)] dark:bg-[var(--surface-elevated)]">
      <div class="flex gap-4 border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-[var(--border-subtle)] dark:bg-[var(--surface-muted)]">
        <div
          v-for="i in columnCount"
          :key="'h' + i"
          class="h-4 flex-1 animate-pulse rounded bg-gray-200 dark:bg-[var(--border-subtle)]"
          :style="{ maxWidth: i === 1 ? '20%' : i === columnCount ? '12%' : '18%' }"
        />
      </div>
      <div
        v-for="r in rows"
        :key="r"
        class="flex items-center gap-4 border-b border-gray-100 px-4 py-3 dark:border-[var(--border-subtle)]"
      >
        <div
          v-for="i in columnCount"
          :key="r + '-' + i"
          class="h-4 flex-1 animate-pulse rounded bg-gray-200 dark:bg-[var(--border-subtle)]"
          :style="{ maxWidth: i === 1 ? '20%' : i === columnCount ? '12%' : '18%' }"
        />
      </div>
    </div>
  </div>
</template>

<script>
export default {
    name: 'TableSkeleton',
    props: {
        rows: {
            type: Number,
            default: 8
        },
        columnCount: {
            type: Number,
            default: 5
        }
    }
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
    animation: table-skeleton-shimmer 1.5s ease-in-out infinite;
}

@keyframes table-skeleton-shimmer {
    0% {
        background-position: 200% 0;
    }
    100% {
        background-position: -200% 0;
    }
}
</style>
