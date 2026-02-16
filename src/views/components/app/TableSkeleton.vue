<template>
    <div class="table-skeleton-wrapper">
        <div class="flex items-center justify-between gap-2 mb-4 p-3 bg-white rounded-lg shadow-sm flex-wrap">
            <div class="flex items-center gap-2 flex-wrap">
                <div class="shimmer-block h-9 w-24 rounded"></div>
                <div class="shimmer-block h-9 w-20 rounded"></div>
                <div class="shimmer-block h-9 w-16 rounded hidden sm:block"></div>
            </div>
            <div class="flex items-center gap-2">
                <div class="shimmer-block h-9 w-32 rounded"></div>
                <div class="shimmer-block h-9 w-9 rounded"></div>
            </div>
        </div>
        <div class="w-full bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div class="bg-gray-50 border-b border-gray-200 px-4 py-3 flex gap-4">
                <div v-for="i in columnCount" :key="'h' + i"
                    class="h-4 rounded bg-gray-200 animate-pulse flex-1"
                    :style="{ maxWidth: i === 1 ? '20%' : i === columnCount ? '12%' : '18%' }">
                </div>
            </div>
            <div v-for="r in rows" :key="r" class="border-b border-gray-100 px-4 py-3 flex gap-4 items-center">
                <div v-for="i in columnCount" :key="r + '-' + i"
                    class="h-4 rounded bg-gray-200 animate-pulse flex-1"
                    :style="{ maxWidth: i === 1 ? '20%' : i === columnCount ? '12%' : '18%' }">
                </div>
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
