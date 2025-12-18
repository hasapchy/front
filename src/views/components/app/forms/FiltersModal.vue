<template>
    <teleport to="body">
        <transition name="filters-modal">
            <div 
                v-if="show"
                class="fixed inset-0 z-50 flex items-end md:items-center md:justify-center"
                @click.self="$emit('close')">
                <div class="filters-modal-content bg-white w-full md:w-auto md:max-w-4xl md:min-w-[600px] md:max-h-[90vh] overflow-y-auto rounded-t-xl md:rounded-xl p-4 md:p-6 shadow-2xl md:m-4">
                    <div class="flex justify-between items-center mb-4 pb-4 border-b">
                        <h3 class="text-lg font-bold">{{ $t('filters') || 'Фильтры' }}</h3>
                        <button @click="$emit('close')" class="text-gray-500 hover:text-gray-700">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                    
                    <div class="space-y-4">
                        <slot />
                    </div>

                    <div class="mt-6 pt-4 border-t flex gap-2">
                        <button 
                            v-if="hasResetButton"
                            @click="$emit('reset')"
                            class="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium transition-colors">
                            {{ $t('resetFilters') || 'Сбросить' }}
                        </button>
                        <button 
                            @click="$emit('apply')"
                            class="flex-1 px-4 py-2 bg-[#5CB85C] hover:bg-[#4EA84E] text-white rounded-md text-sm font-medium transition-colors">
                            {{ $t('apply') || 'Применить' }}
                        </button>
                    </div>
                </div>
            </div>
        </transition>
    </teleport>
</template>

<script>
export default {
    name: 'FiltersModal',
    emits: ['close', 'reset', 'apply'],
    props: {
        show: {
            type: Boolean,
            default: false
        },
        hasResetButton: {
            type: Boolean,
            default: true
        }
    }
}
</script>

<style scoped>
.filters-modal-enter-active,
.filters-modal-leave-active {
    transition: opacity 0.3s ease;
}

.filters-modal-enter-active .filters-modal-content,
.filters-modal-leave-active .filters-modal-content {
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
}

.filters-modal-enter-from {
    opacity: 0;
}

.filters-modal-leave-to {
    opacity: 0;
}

.filters-modal-enter-from .filters-modal-content {
    transform: translateY(100%);
    opacity: 0;
}

.filters-modal-leave-to .filters-modal-content {
    transform: translateY(100%);
    opacity: 0;
}

.filters-modal-enter-to .filters-modal-content,
.filters-modal-leave-from .filters-modal-content {
    transform: translateY(0);
    opacity: 1;
}

@media (min-width: 768px) {
    .filters-modal-enter-from .filters-modal-content {
        transform: scale(0.95) translateY(-20px);
        opacity: 0;
    }

    .filters-modal-leave-to .filters-modal-content {
        transform: scale(0.95) translateY(-20px);
        opacity: 0;
    }

    .filters-modal-enter-to .filters-modal-content,
    .filters-modal-leave-from .filters-modal-content {
        transform: scale(1) translateY(0);
        opacity: 1;
    }
}
</style>

