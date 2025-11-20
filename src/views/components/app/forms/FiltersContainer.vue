<template>
    <div class="flex justify-start items-center">
        <!-- Кнопка фильтра (для всех устройств) -->
        <div class="ml-2 flex items-center gap-2">
            <button 
                @click="showFiltersModal = true"
                class="relative flex items-center gap-2 px-3 py-2 bg-white border-2 border-gray-400 rounded-md hover:border-[#337AB7] transition-colors"
                :class="{ 'border-[#337AB7] bg-blue-50': hasActiveFilters }">
                <i :class="hasActiveFilters ? 'fas fa-filter-circle' : 'fas fa-filter'" class="text-gray-700"></i>
                <span class="text-xs md:text-sm font-medium">{{ $t('filters') || 'Фильтры' }}</span>
                <span v-if="hasActiveFilters" class="absolute -top-1 -right-1 w-3 h-3 bg-[#337AB7] rounded-full border-2 border-white"></span>
                <span v-if="hasActiveFilters && activeFiltersCount > 0" class="bg-[#337AB7] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{{ activeFiltersCount }}</span>
            </button>
            <button 
                v-if="hasActiveFilters"
                @click="handleReset"
                class="px-3 py-2 bg-white border-2 border-red-400 rounded-md hover:border-red-500 transition-colors">
                <i class="fas fa-filter-circle-xmark text-red-600"></i>
            </button>
        </div>

        <!-- Модальное окно фильтров -->
        <FiltersModal 
            :show="showFiltersModal" 
            @close="showFiltersModal = false"
            @reset="handleReset">
            <slot name="mobile" />
        </FiltersModal>
    </div>
</template>

<script>
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import FiltersModal from '@/views/components/app/forms/FiltersModal.vue';

export default {
    name: 'FiltersContainer',
    components: {
        PrimaryButton,
        FiltersModal
    },
    props: {
        hasActiveFilters: {
            type: Boolean,
            default: false
        },
        activeFiltersCount: {
            type: Number,
            default: 0
        }
    },
    emits: ['reset'],
    data() {
        return {
            showFiltersModal: false
        };
    },
    methods: {
        handleReset() {
            this.showFiltersModal = false;
            this.$emit('reset');
        }
    }
}
</script>

