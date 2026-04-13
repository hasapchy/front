<template>
  <div class="space-y-4">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-[var(--border-subtle)] dark:bg-[var(--surface-elevated)]">
        <div class="h-4 w-40 shimmer-block rounded mb-2" />
        <div class="h-3 w-24 shimmer-block rounded mb-4" />
        <div class="h-64 sm:h-80 flex items-center justify-center">
          <div class="w-40 h-40 sm:w-52 sm:h-52 rounded-full shimmer-block" />
        </div>
      </div>
      <div class="hidden rounded-lg border border-gray-200 bg-white p-4 lg:block dark:border-[var(--border-subtle)] dark:bg-[var(--surface-elevated)]">
        <div class="h-4 w-52 shimmer-block rounded mb-2" />
        <div class="h-3 w-28 shimmer-block rounded mb-4" />
        <div class="h-64 sm:h-80 flex items-center justify-center">
          <div class="w-40 h-40 sm:w-52 sm:h-52 rounded-full shimmer-block" />
        </div>
      </div>
    </div>
    <div class="w-full overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-[var(--border-subtle)] dark:bg-[var(--surface-elevated)]">
      <div class="flex gap-4 border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-[var(--border-subtle)] dark:bg-[var(--surface-muted)]">
        <div
          v-for="i in 3"
          :key="'h' + i"
          class="h-4 rounded shimmer-block flex-1"
          :style="{ maxWidth: i === 1 ? '30%' : i === 3 ? '15%' : '20%' }"
        />
      </div>
      <div
        v-for="r in 6"
        :key="r"
        class="flex items-center gap-4 border-b border-gray-100 px-4 py-3 dark:border-[var(--border-subtle)]"
      >
        <div
          v-for="i in 3"
          :key="r + '-' + i"
          class="h-4 rounded shimmer-block flex-1"
          :style="{ maxWidth: i === 1 ? '30%' : i === 3 ? '15%' : '20%' }"
        />
      </div>
    </div>
  </div>
</template>

<script>
export default {
    name: 'ReportByCategoriesSkeleton'
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
    animation: report-skeleton-shimmer 1.5s ease-in-out infinite;
}

@keyframes report-skeleton-shimmer {
    0% {
        background-position: 200% 0;
    }
    100% {
        background-position: -200% 0;
    }
}
</style>

