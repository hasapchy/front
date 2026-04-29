<template>
  <div>
    <div class="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white p-3 shadow-md dark:bg-[var(--surface-elevated)] dark:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.35)]">
      <div class="flex items-center gap-2 flex-wrap">
        <div class="shimmer-block h-9 w-9 rounded flex-shrink-0" />
        <div class="shimmer-block h-9 w-20 rounded flex-shrink-0" />
        <div class="shimmer-block h-9 w-24 rounded flex-shrink-0" />
      </div>
      <div class="flex items-center gap-2">
        <div class="shimmer-block h-8 w-24 rounded" />
        <div class="shimmer-block h-9 w-9 rounded" />
      </div>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="i in 20"
        :key="i"
        class="mapper-card flex min-h-[140px] flex-col rounded-lg border border-gray-200 bg-white p-3 shadow dark:border-[var(--border-subtle)] dark:bg-[var(--surface-elevated)] dark:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.3)]"
      >
        <div class="flex items-start justify-between gap-2 mb-2">
          <div class="flex items-center gap-2 min-w-0 flex-1">
            <div class="shimmer-block h-4 w-4 rounded flex-shrink-0" />
            <div class="shimmer-block h-4 w-4 rounded flex-shrink-0" />
            <div class="shimmer-block h-4 w-28 rounded flex-1 min-w-0" />
          </div>
          <div class="flex gap-1 flex-shrink-0 items-center">
            <div class="shimmer-block h-3.5 w-3.5 rounded-full" />
            <div class="shimmer-block h-3.5 w-3.5 rounded-full" />
            <div class="shimmer-block h-3.5 w-3.5 rounded-full" />
          </div>
        </div>
        <div class="space-y-1 text-sm flex-1">
          <div class="flex gap-1.5 items-center">
            <div class="shimmer-block h-3.5 w-4 shrink-0 rounded" />
            <div class="shimmer-block h-3.5 w-12 shrink-0 rounded" />
            <div class="shimmer-block h-3.5 flex-1 rounded min-w-0" />
          </div>
          <div class="flex gap-1.5 items-center">
            <div class="shimmer-block h-3.5 w-4 shrink-0 rounded" />
            <div class="shimmer-block h-3.5 w-10 shrink-0 rounded" />
            <div class="shimmer-block h-3.5 flex-1 rounded min-w-0" />
          </div>
          <div class="flex gap-1.5 items-center">
            <div class="shimmer-block h-3.5 w-4 shrink-0 rounded" />
            <div class="shimmer-block h-3.5 w-14 shrink-0 rounded" />
            <div class="shimmer-block h-3.5 flex-1 rounded min-w-0" />
          </div>
          <div class="flex gap-1.5 items-center">
            <div class="shimmer-block h-3.5 w-4 shrink-0 rounded" />
            <div class="shimmer-block h-3.5 w-16 shrink-0 rounded" />
            <div class="shimmer-block h-3.5 flex-1 rounded min-w-0" />
          </div>
        </div>
        <div class="mt-auto space-y-1 border-t border-gray-100 pt-2 dark:border-[var(--border-subtle)]">
          <div class="flex justify-between items-center gap-2">
            <div class="shimmer-block h-3.5 w-14 rounded" />
            <div class="shimmer-block h-3.5 w-16 rounded shrink-0" />
          </div>
          <div class="flex justify-between items-center gap-2">
            <div class="shimmer-block h-3.5 w-10 rounded" />
            <div class="shimmer-block h-3.5 w-12 rounded shrink-0" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
    name: 'CardsSkeleton'
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
