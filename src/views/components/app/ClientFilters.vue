<template>
    <FiltersContainer
        :has-active-filters="hasActiveFilters"
        :active-filters-count="activeFiltersCount"
        @reset="$emit('reset')"
        @apply="$emit('apply')">
        <div>
            <label class="block mb-2 text-xs font-semibold">{{ $t('status') || 'Статус' }}</label>
            <select :value="statusFilter" @input="$emit('update:statusFilter', $event.target.value)" class="w-full">
                <option value="">{{ $t('allStatuses') }}</option>
                <option value="active">{{ $t('active') }}</option>
                <option value="inactive">{{ $t('inactive') }}</option>
            </select>
        </div>
        <div>
            <label class="block mb-2 text-xs font-semibold">{{ $t('type') || 'Тип' }}</label>
            <select :value="typeFilter" @input="$emit('update:typeFilter', $event.target.value)" class="w-full">
                <option value="">{{ $t('allTypes') }}</option>
                <option value="individual">{{ $t('individual') }}</option>
                <option value="company">{{ $t('company') }}</option>
                <option value="employee">{{ $t('employee') }}</option>
                <option value="investor">{{ $t('investor') }}</option>
            </select>
        </div>
    </FiltersContainer>
</template>

<script>
import FiltersContainer from '@/views/components/app/forms/FiltersContainer.vue';

export default {
    components: { FiltersContainer },
    props: {
        statusFilter: { type: String, default: '' },
        typeFilter: { type: String, default: '' },
        hasActiveFilters: { type: Boolean, default: false },
        activeFiltersCount: { type: Number, default: 0 }
    },
    emits: ['update:statusFilter', 'update:typeFilter', 'reset', 'apply']
};
</script>
