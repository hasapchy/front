<template>
    <div class="kanban-skeleton-wrapper">
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
        <div class="kanban-skeleton-container overflow-x-auto pb-2">
            <div class="kanban-skeleton-columns flex gap-4">
                <div v-for="c in columnCount" :key="c" class="kanban-skeleton-column flex flex-col flex-shrink-0 rounded-lg bg-white border border-gray-200 overflow-hidden">
                    <div class="h-12 px-4 flex items-center rounded-t-lg bg-gray-200 animate-pulse">
                        <div class="shimmer-block h-5 w-24 rounded"></div>
                    </div>
                    <div class="p-3 flex-1 min-h-[200px]">
                        <div v-for="card in getCardsInColumn(c)" :key="card" class="h-20 rounded-lg bg-gray-100 animate-pulse mb-3"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'KanbanSkeleton',
    props: {
        columnCount: {
            type: Number,
            default: 5
        },
        cardsPerColumn: {
            type: Number,
            default: 3
        }
    },
    methods: {
        getCardsInColumn(columnIndex) {
            const counts = [2, 4, 3, 5, 2, 4, 3, 5];
            const n = counts[columnIndex % counts.length];
            return Array.from({ length: n }, (_, i) => i);
        }
    }
};
</script>

<style scoped>
.kanban-skeleton-column {
    width: 320px;
    min-width: 320px;
    max-height: calc(100vh - 250px);
}

.kanban-skeleton-columns {
    min-width: min-content;
}

.shimmer-block {
    background: linear-gradient(
        90deg,
        #e5e7eb 0%,
        #f3f4f6 20%,
        #e5e7eb 40%,
        #e5e7eb 100%
    );
    background-size: 200% 100%;
    animation: kanban-skeleton-shimmer 1.5s ease-in-out infinite;
}

@keyframes kanban-skeleton-shimmer {
    0% {
        background-position: 200% 0;
    }
    100% {
        background-position: -200% 0;
    }
}
</style>
