<template>
    <FiltersContainer :has-active-filters="hasActiveFilters"
        :active-filters-count="activeFiltersCount" @reset="resetFilters" @apply="applyFilters">
        <div>
            <label class="block mb-2 text-xs font-semibold">{{ $t('dateFilter') || 'Период' }}</label>
            <select :value="dateFilter" @input="$emit('update:dateFilter', $event.target.value)" class="w-full">
                <option value="all_time">{{ $t('allTime') }}</option>
                <option value="today">{{ $t('today') }}</option>
                <option value="yesterday">{{ $t('yesterday') }}</option>
                <option value="this_week">{{ $t('thisWeek') }}</option>
                <option value="this_month">{{ $t('thisMonth') }}</option>
                <option value="last_week">{{ $t('lastWeek') }}</option>
                <option value="last_month">{{ $t('lastMonth') }}</option>
                <option value="custom">{{ $t('selectDates') }}</option>
            </select>
        </div>

        <div v-if="dateFilter === 'custom'" class="space-y-2">
            <div>
                <label class="block mb-2 text-xs font-semibold">{{ $t('startDate') || 'Начальная дата' }}</label>
                <input type="date" :value="startDate" @input="$emit('update:startDate', $event.target.value)" class="w-full" />
            </div>
            <div>
                <label class="block mb-2 text-xs font-semibold">{{ $t('endDate') || 'Конечная дата' }}</label>
                <input type="date" :value="endDate" @input="$emit('update:endDate', $event.target.value)" class="w-full" />
            </div>
        </div>

        <div>
            <label class="block mb-2 text-xs font-semibold">{{ $t('status') || 'Статус' }}</label>
            <select :value="statusFilter" @input="$emit('update:statusFilter', $event.target.value)" class="w-full">
                <option value="">{{ $t('allStatuses') }}</option>
                <option v-for="status in statuses" :key="status.id" :value="status.id">
                    {{ translateOrderStatus(status.name, $t) }}
                </option>
            </select>
        </div>

        <div>
            <label class="block mb-2 text-xs font-semibold">{{ $t('project') || 'Проект' }}</label>
            <select :value="projectFilter" @input="$emit('update:projectFilter', $event.target.value)" class="w-full">
                <option value="">{{ $t('allProjects') }}</option>
                <option v-for="project in projects" :key="project.id" :value="project.id">
                    {{ project.name }}
                </option>
            </select>
        </div>

        <div>
            <label class="block mb-2 text-xs font-semibold">{{ $t('client') || 'Клиент' }}</label>
            <select :value="clientFilter" @input="$emit('update:clientFilter', $event.target.value)" class="w-full">
                <option value="">{{ $t('allClients') }}</option>
                <option v-for="client in clients" :key="client.id" :value="client.id">
                    {{ client.fullName() }}
                </option>
            </select>
        </div>
    </FiltersContainer>
</template>

<script>
import FiltersContainer from '@/views/components/app/forms/FiltersContainer.vue';
import { translateOrderStatus } from '@/utils/translationUtils';

export default {
    components: { FiltersContainer },
    props: {
        dateFilter: { type: String, required: true },
        startDate: { type: String, default: null },
        endDate: { type: String, default: null },
        statusFilter: { type: [String, Number], default: '' },
        projectFilter: { type: [String, Number], default: '' },
        clientFilter: { type: [String, Number], default: '' },
        statuses: { type: Array, default: () => [] },
        projects: { type: Array, default: () => [] },
        clients: { type: Array, default: () => [] },
        hasActiveFilters: { type: Boolean, default: false },
        activeFiltersCount: { type: Number, default: 0 },
    },
    emits: ['update:dateFilter', 'update:startDate', 'update:endDate', 'update:statusFilter', 'update:projectFilter', 'update:clientFilter', 'reset', 'apply'],
    methods: {
        translateOrderStatus,
        resetFilters() {
            this.$emit('reset');
        },
        applyFilters() {
            this.$emit('apply');
        },
    },
};
</script>

