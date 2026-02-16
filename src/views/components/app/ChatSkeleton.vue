<template>
    <div class="w-full h-[calc(100vh-6rem)] flex overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <aside class="w-full md:w-[360px] shrink-0 border-r border-gray-200 bg-white flex flex-col min-h-0">
            <div class="px-3 py-2 border-b border-gray-200">
                <div class="flex items-center gap-2">
                    <div class="flex-1">
                        <div class="h-9 w-full rounded-full shimmer-block"></div>
                    </div>
                    <div class="w-9 h-9 rounded-lg shimmer-block"></div>
                </div>
            </div>
            <div class="flex-1 overflow-y-auto min-h-0 px-3 py-3 space-y-2">
                <div v-for="i in 7" :key="i" class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full shimmer-block"></div>
                    <div class="flex-1 space-y-2">
                        <div class="h-3 w-3/4 rounded shimmer-block"></div>
                        <div class="flex items-center justify-between gap-2">
                            <div class="h-3 w-1/2 rounded shimmer-block"></div>
                            <div class="h-3 w-6 rounded-full shimmer-block"></div>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
        <section class="flex-1 min-w-0 flex flex-col">
            <div class="h-14 px-4 border-b border-gray-200 flex items-center justify-between bg-white">
                <div class="flex items-center gap-3 min-w-0 flex-1">
                    <div class="w-10 h-10 rounded-full shimmer-block"></div>
                    <div class="flex-1 space-y-2">
                        <div class="h-4 w-1/3 rounded shimmer-block"></div>
                        <div class="h-3 w-1/4 rounded shimmer-block"></div>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <div class="w-9 h-9 rounded-full shimmer-block"></div>
                </div>
            </div>
            <div class="flex-1 min-h-0 messenger-bg overflow-hidden">
                <div class="h-full overflow-y-auto px-4 md:px-6 py-4 space-y-3">
                    <div v-for="g in 4" :key="g" class="space-y-2">
                        <div class="flex justify-center my-2">
                            <div class="h-5 w-32 rounded-full shimmer-block"></div>
                        </div>
                        <div class="space-y-2">
                            <div class="flex" :class="g % 2 === 0 ? 'justify-start' : 'justify-end'">
                                <div class="max-w-[70%] rounded-2xl px-3 py-2 shimmer-block"></div>
                            </div>
                            <div class="flex" :class="g % 2 === 0 ? 'justify-start' : 'justify-end'">
                                <div class="max-w-[55%] rounded-2xl px-3 py-2 shimmer-block"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="p-3 bg-white border-t border-gray-200">
                <div class="flex items-end gap-2">
                    <div class="flex items-center gap-1">
                        <div class="w-9 h-9 rounded-lg shimmer-block"></div>
                        <div class="w-9 h-9 rounded-lg shimmer-block"></div>
                    </div>
                    <div class="flex-1 rounded-lg px-4 py-3 border border-gray-200 bg-gray-50">
                        <div class="h-4 w-full rounded shimmer-block"></div>
                    </div>
                    <div class="w-9 h-9 rounded-full shimmer-block"></div>
                </div>
            </div>
        </section>
    </div>
</template>

<script>
export default {
    name: 'ChatSkeleton'
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
    animation: chat-skeleton-shimmer 1.5s ease-in-out infinite;
}

@keyframes chat-skeleton-shimmer {
    0% {
        background-position: 200% 0;
    }
    100% {
        background-position: -200% 0;
    }
}

.messenger-bg {
    background-color: #d9dbd5;
    background-image:
        radial-gradient(circle at 20px 20px, rgba(255, 255, 255, 0.2) 0 1.5px, transparent 2px),
        radial-gradient(circle at 80px 60px, rgba(255, 255, 255, 0.15) 0 1.5px, transparent 2px),
        radial-gradient(circle at 120px 30px, rgba(255, 255, 255, 0.15) 0 1.5px, transparent 2px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.05), rgba(0, 0, 0, 0.02));
    background-size: 140px 100px, 180px 120px, 200px 120px, 100% 100%;
    background-repeat: repeat, repeat, repeat, no-repeat;
}
</style>

