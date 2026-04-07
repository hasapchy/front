<template>
  <div class="news-page-skeleton h-full flex flex-col">
    <div class="bg-white dark:bg-[var(--surface-elevated)] border-b border-gray-200 dark:border-white/10 px-4 sm:px-6 py-4 flex items-center gap-3 flex-wrap">
      <div class="shimmer-block h-10 w-10 rounded-lg shrink-0" />
      <div class="shimmer-block h-9 w-32 rounded-lg" />
      <div class="shimmer-block h-9 w-24 rounded-lg hidden sm:block" />
      <div class="shimmer-block h-9 w-28 rounded-lg" />
    </div>
    <div class="flex-1 flex flex-col lg:flex-row gap-6 px-4 sm:px-6 py-4 bg-gray-50 dark:bg-[var(--surface-page)]">
      <div class="flex-1 min-w-0 space-y-4">
        <div class="shimmer-block h-7 w-24 rounded mb-4" />
        <div
          v-for="i in 3"
          :key="i"
          class="bg-white dark:bg-[var(--surface-elevated)] rounded-lg border border-gray-200 dark:border-white/10 p-4"
        >
          <div class="flex gap-3 mb-3">
            <div class="shimmer-block h-10 w-10 rounded-full shrink-0" />
            <div class="flex-1 space-y-2">
              <div class="shimmer-block h-4 w-1/3 rounded" />
              <div class="shimmer-block h-3 w-20 rounded" />
            </div>
          </div>
          <div class="space-y-2">
            <div class="shimmer-block h-4 w-full rounded" />
            <div class="shimmer-block h-4 w-4/5 rounded" />
            <div class="shimmer-block h-4 w-2/5 rounded" />
          </div>
        </div>
      </div>
      <aside class="w-full lg:w-80 xl:w-96 shrink-0 space-y-4">
        <div
          v-for="i in 3"
          :key="i"
          class="bg-white dark:bg-[var(--surface-elevated)] rounded-lg border border-gray-200 dark:border-white/10 p-4"
        >
          <div class="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100 dark:border-white/10">
            <div class="shimmer-block h-4 w-4 rounded" />
            <div class="shimmer-block h-4 w-28 rounded" />
          </div>
          <div class="space-y-2">
            <div
              v-for="j in 3"
              :key="j"
              class="flex items-center gap-2"
            >
              <div class="shimmer-block h-8 w-8 rounded-full shrink-0" />
              <div class="shimmer-block h-4 flex-1 rounded" />
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script>
export default {
    name: 'NewsPageSkeleton'
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
    animation: news-skeleton-shimmer 1.5s ease-in-out infinite;
}

@keyframes news-skeleton-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}
</style>
