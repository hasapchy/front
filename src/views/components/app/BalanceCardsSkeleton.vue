<template>
    <div class="w-full flex flex-wrap gap-4 pb-1">
        <div v-for="i in cardCount" :key="i"
            class="balance-card-wrapper flex-shrink-0 bg-white p-3 rounded-lg shadow-md relative"
            style="width: 250px; min-width: 250px;">
            <div class="cash-register-title mb-2 flex items-center justify-center gap-2">
                <div class="balance-cards-skeleton-shimmer h-3 w-3 rounded"></div>
                <div class="balance-cards-skeleton-shimmer h-4 w-4 rounded"></div>
                <div class="balance-cards-skeleton-shimmer h-4 w-28 rounded"></div>
            </div>
            <div class="grid grid-cols-3 gap-2">
                <div v-for="j in 3" :key="j" class="balance-item text-center">
                    <div class="balance-header flex items-center justify-center gap-1 mb-1">
                        <div class="balance-cards-skeleton-shimmer h-3 w-12 rounded"></div>
                    </div>
                    <div class="balance-value">
                        <div class="balance-cards-skeleton-shimmer h-5 w-14 rounded mx-auto"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'BalanceCardsSkeleton',
    props: {
        cardCount: {
            type: Number,
            default: 4
        }
    }
};
</script>

<style scoped>
.balance-cards-skeleton-shimmer {
    background: linear-gradient(
        90deg,
        #e5e7eb 0%,
        #f3f4f6 20%,
        #e5e7eb 40%,
        #e5e7eb 100%
    );
    background-size: 200% 100%;
    animation: balance-cards-skeleton-shimmer 1.5s ease-in-out infinite;
}

@keyframes balance-cards-skeleton-shimmer {
    0% {
        background-position: 200% 0;
    }
    100% {
        background-position: -200% 0;
    }
}
</style>
