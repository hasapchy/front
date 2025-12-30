<template>
    <FiltersContainer
        :has-active-filters="hasActiveFilters"
        :active-filters-count="activeFiltersCount"
        @reset="resetFilters"
        @apply="applyFilters">
        <div>
            <label class="block mb-2 text-xs font-semibold">{{ $t('status') || 'Статус' }}</label>
            <select :value="statusFilter" @input="$emit('update:statusFilter', $event.target.value)" class="w-full">
                <option value="">{{ $t('allStatuses') }}</option>
                <option v-for="status in statuses" :key="status.id" :value="status.id">
                    {{ translateTaskStatus(status.name, $t) }}
                </option>
            </select>
        </div>

        <div>
            <label class="block mb-2 text-xs font-semibold">{{ $t('client') || 'Клиент' }}</label>
            <select :value="clientFilter" @input="$emit('update:clientFilter', $event.target.value)" class="w-full">
                <option value="">{{ $t('allClients') }}</option>
                <option v-for="client in clients" :key="client.id" :value="client.id">
                    {{ client.first_name }} {{ client.last_name || client.contact_person }}
                </option>
            </select>
        </div>
    </FiltersContainer>
</template>

<script>
import FiltersContainer from '@/views/components/app/forms/FiltersContainer.vue';
import { translateTaskStatus } from '@/utils/translationUtils';

export default {
    components: { FiltersContainer },
    props: {
        statusFilter: { type: [String, Number], default: '' },
        clientFilter: { type: [String, Number], default: '' },
        statuses: { type: Array, default: () => [] },
        clients: { type: Array, default: () => [] },
        hasActiveFilters: { type: Boolean, default: false },
        activeFiltersCount: { type: Number, default: 0 },
    },
    emits: ['update:statusFilter', 'update:clientFilter', 'reset', 'apply'],
    methods: {
        translateTaskStatus,
        resetFilters() {
            this.$emit('reset');
        },
        applyFilters() {
            this.$emit('apply');
        },
    },
};
</script>

