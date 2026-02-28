<template>
    <FiltersContainer
        :has-active-filters="hasActiveFilters"
        :active-filters-count="activeFiltersCount"
        @reset="$emit('reset')"
        @apply="$emit('apply')">
        <div>
            <label class="block mb-2 text-xs font-semibold">{{ $t('cashRegister') }}</label>
            <select :value="cashRegisterId" @input="$emit('update:cashRegisterId', $event.target.value)" class="w-full">
                <option value="">{{ $t('allCashRegisters') }}</option>
                <option v-for="parent in allCashRegisters" :key="parent.id" :value="parent.id">
                    {{ parent.name }} ({{ parent.currencySymbol || '' }})
                </option>
            </select>
        </div>
        <div>
            <label class="block mb-2 text-xs font-semibold">{{ $t('transactionType') }}</label>
            <select :value="transactionTypeFilter" @input="$emit('update:transactionTypeFilter', $event.target.value)" class="w-full">
                <option value="">{{ $t('allTransactionTypes') }}</option>
                <option value="income">{{ $t('income') }}</option>
                <option value="outcome">{{ $t('outcome') }}</option>
                <option value="transfer">{{ $t('transfer') }}</option>
            </select>
        </div>
        <div>
            <label class="block mb-2 text-xs font-semibold">{{ $t('source') }}</label>
            <select :value="sourceFilter" @input="$emit('update:sourceFilter', $event.target.value)" class="w-full">
                <option value="">{{ $t('allSources') }}</option>
                <option v-for="option in sourceOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                </option>
            </select>
        </div>
        <div>
            <label class="block mb-2 text-xs font-semibold">{{ $t('project') }}</label>
            <select :value="projectId" @input="$emit('update:projectId', $event.target.value)" class="w-full">
                <option value="">{{ $t('allProjects') }}</option>
                <option v-for="project in allProjects" :key="project.id" :value="project.id">
                    {{ project.name }}
                </option>
            </select>
        </div>
        <div>
            <label class="block mb-2 text-xs font-semibold">{{ $t('debtFilter') }}</label>
            <select :value="debtFilter" @input="$emit('update:debtFilter', $event.target.value)" class="w-full">
                <option value="all">{{ $t('allTransactions') }}</option>
                <option value="false">{{ $t('nonDebtTransactions') }}</option>
                <option value="true">{{ $t('debtsOnly') }}</option>
            </select>
        </div>
        <div>
            <label class="block mb-2 text-xs font-semibold">{{ $t('dateFilter') }}</label>
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
                <label class="block mb-2 text-xs font-semibold">{{ $t('startDate') }}</label>
                <input type="date" :value="startDate" @input="$emit('update:startDate', $event.target.value)" class="w-full" />
            </div>
            <div>
                <label class="block mb-2 text-xs font-semibold">{{ $t('endDate') }}</label>
                <input type="date" :value="endDate" @input="$emit('update:endDate', $event.target.value)" class="w-full" />
            </div>
        </div>
    </FiltersContainer>
</template>

<script>
import FiltersContainer from '@/views/components/app/forms/FiltersContainer.vue';

export default {
    name: 'TransactionFilters',
    components: { FiltersContainer },
    props: {
        cashRegisterId: { type: String, default: '' },
        transactionTypeFilter: { type: String, default: '' },
        sourceFilter: { type: String, default: '' },
        projectId: { type: String, default: '' },
        debtFilter: { type: String, default: 'all' },
        dateFilter: { type: String, default: 'this_month' },
        startDate: { type: String, default: null },
        endDate: { type: String, default: null },
        allCashRegisters: { type: Array, default: () => [] },
        allProjects: { type: Array, default: () => [] },
        sourceOptions: { type: Array, default: () => [] },
        hasActiveFilters: { type: Boolean, default: false },
        activeFiltersCount: { type: Number, default: 0 }
    },
    emits: [
        'update:cashRegisterId', 'update:transactionTypeFilter', 'update:sourceFilter',
        'update:projectId', 'update:debtFilter', 'update:dateFilter', 'update:startDate', 'update:endDate',
        'reset', 'apply'
    ]
};
</script>
