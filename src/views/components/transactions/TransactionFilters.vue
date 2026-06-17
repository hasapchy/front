<template>
  <FiltersContainer
    :has-active-filters="hasActiveFilters"
    :active-filters-count="activeFiltersCount"
    :filter-state="filterState"
    :filter-chips="filterActiveChips"
    @reset="$emit('reset')"
    @apply="$emit('apply')"
    @discard="restoreFilterState"
    @remove-filter-chip="removeFilterChip"
  >
    <FilterFormSection>
      <FilterFormField
        :label="$t('cashRegister')"
        :icon="FILTER_FIELD_ICONS.cashRegister"
      >
        <select
          :value="cashRegisterId ?? ''"
          class="w-full"
          @input="$emit('update:cashRegisterId', $event.target.value)"
        >
          <option value="">
            {{ $t('allCashRegisters') }}
          </option>
          <option
            v-for="parent in allCashRegisters"
            :key="parent.id"
            :value="parent.id"
          >
            {{ parent.displayName || parent.name }} ({{ parent.currencyCode }})
          </option>
        </select>
      </FilterFormField>
      <FilterFormField
        :label="$t('transactionType')"
        :icon="FILTER_FIELD_ICONS.transactionType"
      >
        <div
          ref="transactionTypeDropdownRoot"
          :class="['relative isolate', transactionTypeDropdownOpen ? 'z-[1000]' : 'z-10']"
        >
          <button
            type="button"
            class="w-full h-[42px] px-3 border border-[var(--border-default)] rounded-[10px] bg-[var(--surface-primary)] text-[var(--text-primary)] flex items-center justify-between gap-2"
            @click="toggleTransactionTypeDropdown"
          >
            <span class="flex items-center gap-2 min-w-0">
              <i :class="['fas', selectedTransactionTypeOption.icon, selectedTransactionTypeOption.iconColor, 'text-sm w-4 text-center shrink-0']" />
              <span class="truncate">{{ selectedTransactionTypeOption.label }}</span>
            </span>
            <i :class="['fas fa-chevron-down text-xs transition-transform duration-150', transactionTypeDropdownOpen ? 'rotate-180' : '']" />
          </button>
          <transition name="fade">
            <div
              v-if="transactionTypeDropdownOpen"
              class="absolute z-[1200] mt-1 w-full rounded-[10px] border border-[var(--border-default)] bg-white dark:bg-[var(--surface-elevated)] shadow-lg overflow-hidden"
            >
              <button
                v-for="option in transactionTypeOptionsWithAll"
                :key="option.value || 'all'"
                type="button"
                class="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-[var(--surface-muted)]"
                @click="selectTransactionTypeFilter(option.value)"
              >
                <i :class="['fas', option.icon, option.iconColor, 'text-sm w-4 text-center shrink-0']" />
                <span class="truncate">{{ option.label }}</span>
              </button>
            </div>
          </transition>
        </div>
      </FilterFormField>
      <FilterFormField
        :label="$t('source')"
        :icon="FILTER_FIELD_ICONS.source"
      >
        <div
          ref="sourceDropdownRoot"
          :class="['relative isolate', sourceDropdownOpen ? 'z-[1000]' : 'z-10']"
        >
          <button
            type="button"
            class="w-full h-[42px] px-3 border border-[var(--border-default)] rounded-[10px] bg-[var(--surface-primary)] text-[var(--text-primary)] flex items-center justify-between gap-2"
            @click="toggleSourceDropdown"
          >
            <span class="flex items-center gap-2 min-w-0">
              <i :class="['fas', selectedSourceOption.icon, selectedSourceOption.iconColor, 'text-sm w-4 text-center shrink-0']" />
              <span class="truncate">{{ selectedSourceOption.label }}</span>
            </span>
            <i :class="['fas fa-chevron-down text-xs transition-transform duration-150', sourceDropdownOpen ? 'rotate-180' : '']" />
          </button>
          <transition name="fade">
            <div
              v-if="sourceDropdownOpen"
              class="absolute z-[1200] mt-1 w-full rounded-[10px] border border-[var(--border-default)] bg-white dark:bg-[var(--surface-elevated)] shadow-lg overflow-hidden"
            >
              <button
                v-for="option in sourceOptionsWithAll"
                :key="option.value || 'all'"
                type="button"
                class="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-[var(--surface-muted)]"
                @click="selectSourceFilter(option.value)"
              >
                <i :class="['fas', option.icon, option.iconColor, 'text-sm w-4 text-center shrink-0']" />
                <span class="truncate">{{ option.label }}</span>
              </button>
            </div>
          </transition>
        </div>
      </FilterFormField>
      <FilterFormField
        :label="$t('project')"
        :icon="FILTER_FIELD_ICONS.project"
      >
        <select
          :value="projectId ?? ''"
          class="w-full"
          @input="$emit('update:projectId', $event.target.value)"
        >
          <option value="">
            {{ $t('allProjects') }}
          </option>
          <option
            v-for="project in allProjects"
            :key="project.id"
            :value="project.id"
          >
            {{ project.name }}
          </option>
        </select>
      </FilterFormField>
      <FilterFormField
        :label="$t('debtFilter')"
        :icon="FILTER_FIELD_ICONS.debt"
      >
        <select
          :value="debtFilter"
          class="w-full"
          @input="$emit('update:debtFilter', $event.target.value)"
        >
          <option value="all">
            {{ $t('allTransactions') }}
          </option>
          <option value="false">
            {{ $t('nonDebtTransactions') }}
          </option>
          <option value="true">
            {{ $t('debtsOnly') }}
          </option>
        </select>
      </FilterFormField>
      <FilterFormField
        :label="$t('dateFilter')"
        :icon="FILTER_FIELD_ICONS.date"
      >
        <select
          :value="dateFilter"
          class="w-full"
          @input="$emit('update:dateFilter', $event.target.value)"
        >
          <option value="all_time">
            {{ $t('allTime') }}
          </option>
          <option value="today">
            {{ $t('today') }}
          </option>
          <option value="yesterday">
            {{ $t('yesterday') }}
          </option>
          <option value="this_week">
            {{ $t('thisWeek') }}
          </option>
          <option value="this_month">
            {{ $t('thisMonth') }}
          </option>
          <option value="last_week">
            {{ $t('lastWeek') }}
          </option>
          <option value="last_month">
            {{ $t('lastMonth') }}
          </option>
          <option value="custom">
            {{ $t('selectDates') }}
          </option>
        </select>
      </FilterFormField>
      <FilterFormField
        v-if="dateFilter === 'custom'"
        :label="$t('startDate')"
        :icon="FILTER_FIELD_ICONS.startDate"
      >
        <input
          type="date"
          :value="startDate"
          class="w-full"
          @input="$emit('update:startDate', $event.target.value)"
        >
      </FilterFormField>
      <FilterFormField
        v-if="dateFilter === 'custom'"
        :label="$t('endDate')"
        :icon="FILTER_FIELD_ICONS.endDate"
      >
        <input
          type="date"
          :value="endDate"
          class="w-full"
          @input="$emit('update:endDate', $event.target.value)"
        >
      </FilterFormField>
    </FilterFormSection>
  </FiltersContainer>
</template>

<script>
import FiltersContainer from '@/views/components/app/forms/FiltersContainer.vue';
import FilterFormField from '@/views/components/app/forms/FilterFormField.vue';
import FilterFormSection from '@/views/components/app/forms/FilterFormSection.vue';
import { FILTER_FIELD_ICONS } from '@/constants/filterFormIcons';
import { formatDateFilterSummary, buildFilterChip, buildDateFilterChip } from '@/utils/filterSummaryUtils';

export default {
    name: 'TransactionFilters',
    components: { FiltersContainer, FilterFormField, FilterFormSection },
    props: {
        cashRegisterId: { type: [String, Number], default: '' },
        transactionTypeFilter: { type: [String, Number], default: '' },
        sourceFilter: { type: [String, Number], default: '' },
        projectId: { type: [String, Number], default: '' },
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
    ],
    data() {
        return {
            FILTER_FIELD_ICONS,
            sourceDropdownOpen: false,
            transactionTypeDropdownOpen: false,
        };
    },
    computed: {
        transactionTypeOptionsWithAll() {
            return [
                { value: '', label: this.$t('allTransactionTypes'), icon: 'fa-list', iconColor: 'text-[var(--text-secondary)]' },
                { value: 'income', label: this.$t('income'), icon: 'fa-plus', iconColor: 'text-[var(--color-success)]' },
                { value: 'outcome', label: this.$t('outcome'), icon: 'fa-minus', iconColor: 'text-[var(--color-danger)]' },
                { value: 'transfer', label: this.$t('transfer'), icon: 'fa-right-left', iconColor: 'text-[var(--color-info)]' },
            ];
        },
        selectedTransactionTypeOption() {
            return this.transactionTypeOptionsWithAll.find((item) => String(item.value) === String(this.transactionTypeFilter ?? ''))
                || this.transactionTypeOptionsWithAll[0];
        },
        sourceOptionsWithAll() {
            return [
                { value: '', label: this.$t('allSources'), icon: 'fa-list', iconColor: 'text-[var(--text-secondary)]' },
                ...this.sourceOptions.map((option) => ({
                    value: option.value,
                    label: option.label,
                    icon: option.icon || this.resolveSourceIcon(option.value),
                    iconColor: option.iconColor || this.resolveSourceIconColor(option.value),
                })),
            ];
        },
        selectedSourceOption() {
            return this.sourceOptionsWithAll.find((item) => String(item.value) === String(this.sourceFilter ?? ''))
                || this.sourceOptionsWithAll[0];
        },
        filterState() {
            return {
                cashRegisterId: this.cashRegisterId ?? '',
                transactionTypeFilter: this.transactionTypeFilter ?? '',
                sourceFilter: this.sourceFilter ?? '',
                projectId: this.projectId ?? '',
                debtFilter: this.debtFilter ?? 'all',
                dateFilter: this.dateFilter ?? 'this_month',
                startDate: this.startDate,
                endDate: this.endDate,
            };
        },
        filterParts() {
            const parts = [];
            const cash = this.allCashRegisters.find((item) => String(item.id) === String(this.cashRegisterId));
            if (cash) {
                parts.push(buildFilterChip('cashRegisterId', this.$t('cashRegister'), cash.displayName || cash.name));
            }
            if (this.transactionTypeFilter) {
                parts.push(buildFilterChip('transactionTypeFilter', this.$t('transactionType'), this.$t(this.transactionTypeFilter)));
            }
            if (this.sourceFilter) {
                const source = this.sourceOptions.find((item) => String(item.value) === String(this.sourceFilter));
                parts.push(buildFilterChip('sourceFilter', this.$t('source'), source?.label || this.sourceFilter));
            }
            if (this.projectId) {
                const project = this.allProjects.find((item) => String(item.id) === String(this.projectId));
                parts.push(buildFilterChip('projectId', this.$t('project'), project?.name || this.projectId));
            }
            if (this.debtFilter && this.debtFilter !== 'all') {
                parts.push(buildFilterChip(
                    'debtFilter',
                    this.$t('debtFilter'),
                    this.debtFilter === 'true' ? this.$t('debtsOnly') : this.$t('nonDebtTransactions'),
                ));
            }
            const periodChip = buildDateFilterChip(this.$t, this.dateFilter, this.startDate, this.endDate);
            if (periodChip) {
                parts.push(periodChip);
            }
            return parts;
        },
        filterActiveChips() {
            return this.filterParts;
        },
    },
    methods: {
        toggleTransactionTypeDropdown() {
            this.transactionTypeDropdownOpen = !this.transactionTypeDropdownOpen;
        },
        selectTransactionTypeFilter(value) {
            this.$emit('update:transactionTypeFilter', value);
            this.transactionTypeDropdownOpen = false;
        },
        handleTransactionTypeDropdownClickOutside(event) {
            if (!this.transactionTypeDropdownOpen) {
                return;
            }
            const root = this.$refs.transactionTypeDropdownRoot;
            if (root && !root.contains(event.target)) {
                this.transactionTypeDropdownOpen = false;
            }
        },
        toggleSourceDropdown() {
            this.sourceDropdownOpen = !this.sourceDropdownOpen;
        },
        selectSourceFilter(value) {
            this.$emit('update:sourceFilter', value);
            this.sourceDropdownOpen = false;
        },
        handleSourceDropdownClickOutside(event) {
            if (!this.sourceDropdownOpen) {
                return;
            }
            const root = this.$refs.sourceDropdownRoot;
            if (root && !root.contains(event.target)) {
                this.sourceDropdownOpen = false;
            }
        },
        resolveSourceIcon(sourceValue) {
            const map = {
                sale: 'fa-shopping-cart',
                order: 'fa-file-invoice',
                receipt: 'fa-box',
                writeoff: 'fa-box-open',
                purchase: 'fa-cart-plus',
                contract: 'fa-file-contract',
                transaction: 'fa-money-bill-transfer',
                salary: 'fa-money-bill-wave',
                other: 'fa-ellipsis',
                return_supplier: 'fa-rotate-left',
            };
            return map[sourceValue] || 'fa-link';
        },
        resolveSourceIconColor(sourceValue) {
            const map = {
                sale: 'text-[var(--color-success)]',
                order: 'text-[var(--color-info)]',
                receipt: 'text-[#FFA500]',
                writeoff: 'text-[var(--color-danger)]',
                purchase: 'text-[var(--color-info)]',
                contract: 'text-[var(--color-info)]',
                transaction: 'text-[#6C757D]',
                salary: 'text-[#28A745]',
                other: 'text-[var(--text-secondary)]',
                return_supplier: 'text-[var(--color-danger)]',
            };
            return map[sourceValue] || 'text-[var(--text-secondary)]';
        },
        removeFilterChip(key) {
            switch (key) {
            case 'cashRegisterId':
                this.$emit('update:cashRegisterId', '');
                break;
            case 'transactionTypeFilter':
                this.$emit('update:transactionTypeFilter', '');
                break;
            case 'sourceFilter':
                this.$emit('update:sourceFilter', '');
                break;
            case 'projectId':
                this.$emit('update:projectId', '');
                break;
            case 'debtFilter':
                this.$emit('update:debtFilter', 'all');
                break;
            case 'dateFilter':
                this.$emit('update:dateFilter', 'this_month');
                this.$emit('update:startDate', null);
                this.$emit('update:endDate', null);
                break;
            default:
                return;
            }
            this.$emit('apply');
        },
        restoreFilterState(snapshot) {
            if (!snapshot) {
                return;
            }
            this.$emit('update:cashRegisterId', snapshot.cashRegisterId ?? '');
            this.$emit('update:transactionTypeFilter', snapshot.transactionTypeFilter ?? '');
            this.$emit('update:sourceFilter', snapshot.sourceFilter ?? '');
            this.$emit('update:projectId', snapshot.projectId ?? '');
            this.$emit('update:debtFilter', snapshot.debtFilter ?? 'all');
            this.$emit('update:dateFilter', snapshot.dateFilter ?? 'this_month');
            this.$emit('update:startDate', snapshot.startDate ?? null);
            this.$emit('update:endDate', snapshot.endDate ?? null);
        },
    },
    mounted() {
        document.addEventListener('click', this.handleTransactionTypeDropdownClickOutside);
        document.addEventListener('click', this.handleSourceDropdownClickOutside);
    },
    beforeUnmount() {
        document.removeEventListener('click', this.handleTransactionTypeDropdownClickOutside);
        document.removeEventListener('click', this.handleSourceDropdownClickOutside);
    },
};
</script>
