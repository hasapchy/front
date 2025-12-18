<template>
    <div class="flex items-center justify-between gap-2 mb-4 p-3 bg-white rounded-lg shadow-sm flex-wrap">
        <div class="flex items-center gap-2 flex-wrap">
            <slot name="left">
                <PrimaryButton 
                    v-if="showCreateButton && onCreateClick"
                    :onclick="onCreateClick" 
                    icon="fas fa-plus"
                    :disabled="createButtonDisabled">
                </PrimaryButton>
                
                <slot name="additionalButtons"></slot>
                
                <slot name="filters-desktop"></slot>
            </slot>
        </div>
        
        <div class="flex items-center gap-2">
            <slot name="right" :resetColumns="$attrs.resetColumns" :columns="$attrs.columns" :toggleVisible="$attrs.toggleVisible" :log="$attrs.log">
                <Pagination 
                    v-if="showPagination && paginationData && onPageChange"
                    :currentPage="paginationData.currentPage" 
                    :lastPage="paginationData.lastPage"
                    :per-page="paginationData.perPage" 
                    :per-page-options="paginationData.perPageOptions" 
                    :show-per-page-selector="paginationData.showPerPageSelector !== false"
                    @changePage="onPageChange" 
                    @perPageChange="onPerPageChange" 
                />
            </slot>
            <slot name="gear" :resetColumns="$attrs.resetColumns" :columns="$attrs.columns" :toggleVisible="$attrs.toggleVisible" :log="$attrs.log"></slot>
        </div>
    </div>
</template>

<script>
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import FiltersContainer from '@/views/components/app/forms/FiltersContainer.vue';
import Pagination from '@/views/components/app/buttons/Pagination.vue';

export default {
    name: 'TableControlsBar',
    components: {
        PrimaryButton,
        FiltersContainer,
        Pagination
    },
    props: {
        showCreateButton: {
            type: Boolean,
            default: false
        },
        onCreateClick: {
            type: Function,
            default: null
        },
        createButtonDisabled: {
            type: Boolean,
            default: false
        },
        showFilters: {
            type: Boolean,
            default: false
        },
        hasActiveFilters: {
            type: Boolean,
            default: false
        },
        activeFiltersCount: {
            type: Number,
            default: 0
        },
        onFiltersReset: {
            type: Function,
            default: null
        },
        showPagination: {
            type: Boolean,
            default: false
        },
        paginationData: {
            type: Object,
            default: null
        },
        onPageChange: {
            type: Function,
            default: null
        },
        onPerPageChange: {
            type: Function,
            default: null
        }
    },
};
</script>

