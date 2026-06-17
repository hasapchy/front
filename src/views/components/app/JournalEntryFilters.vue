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
        :label="$t('status')"
        :icon="FILTER_FIELD_ICONS.status"
      >
        <select
          :value="statusFilter"
          class="w-full"
          @input="$emit('update:statusFilter', $event.target.value)"
        >
          <option value="">
            {{ $t('allStatuses') }}
          </option>
          <option value="draft">
            {{ $t('journalEntryStatus.draft') }}
          </option>
          <option value="posted">
            {{ $t('journalEntryStatus.posted') }}
          </option>
          <option value="reversed">
            {{ $t('journalEntryStatus.reversed') }}
          </option>
        </select>
      </FilterFormField>
      <FilterFormField
        :label="$t('type')"
        :icon="FILTER_FIELD_ICONS.type"
      >
        <select
          :value="templateKeyFilter"
          class="w-full"
          @input="$emit('update:templateKeyFilter', $event.target.value)"
        >
          <option value="">
            {{ $t('allTypes') }}
          </option>
          <option value="manual">
            {{ $t('journalEntryTemplate.manual') }}
          </option>
          <option value="order_cogs">
            {{ $t('journalEntryTemplate.order_cogs') }}
          </option>
          <option value="order_revenue">
            {{ $t('journalEntryTemplate.order_revenue') }}
          </option>
          <option value="salary_accrual">
            {{ $t('journalEntryTemplate.salary_accrual') }}
          </option>
        </select>
      </FilterFormField>
      <FilterFormField
        :label="$t('dateFrom')"
        :icon="FILTER_FIELD_ICONS.date"
      >
        <input
          :value="dateFrom"
          type="date"
          class="w-full"
          @input="$emit('update:dateFrom', $event.target.value)"
        >
      </FilterFormField>
      <FilterFormField
        :label="$t('dateTo')"
        :icon="FILTER_FIELD_ICONS.date"
      >
        <input
          :value="dateTo"
          type="date"
          class="w-full"
          @input="$emit('update:dateTo', $event.target.value)"
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
import { buildFilterChip } from '@/utils/filterSummaryUtils';

export default {
    components: { FiltersContainer, FilterFormField, FilterFormSection },
    props: {
        statusFilter: { type: String, default: '' },
        templateKeyFilter: { type: String, default: '' },
        dateFrom: { type: String, default: '' },
        dateTo: { type: String, default: '' },
        hasActiveFilters: { type: Boolean, default: false },
        activeFiltersCount: { type: Number, default: 0 },
    },
    emits: ['update:statusFilter', 'update:templateKeyFilter', 'update:dateFrom', 'update:dateTo', 'reset', 'apply'],
    data() {
        return {
            FILTER_FIELD_ICONS,
            filterState: {
                statusFilter: this.statusFilter,
                templateKeyFilter: this.templateKeyFilter,
                dateFrom: this.dateFrom,
                dateTo: this.dateTo,
            },
        };
    },
    computed: {
        filterActiveChips() {
            const chips = [];
            if (this.statusFilter) {
                chips.push(buildFilterChip(this.$t('status'), this.$t(`journalEntryStatus.${this.statusFilter}`)));
            }
            if (this.templateKeyFilter) {
                chips.push(buildFilterChip(this.$t('type'), this.$t(`journalEntryTemplate.${this.templateKeyFilter}`)));
            }
            if (this.dateFrom) {
                chips.push(buildFilterChip(this.$t('dateFrom'), this.dateFrom));
            }
            if (this.dateTo) {
                chips.push(buildFilterChip(this.$t('dateTo'), this.dateTo));
            }
            return chips;
        },
    },
    watch: {
        statusFilter(value) {
            this.filterState.statusFilter = value;
        },
        templateKeyFilter(value) {
            this.filterState.templateKeyFilter = value;
        },
        dateFrom(value) {
            this.filterState.dateFrom = value;
        },
        dateTo(value) {
            this.filterState.dateTo = value;
        },
    },
    methods: {
        restoreFilterState() {
            this.$emit('update:statusFilter', this.filterState.statusFilter);
            this.$emit('update:templateKeyFilter', this.filterState.templateKeyFilter);
            this.$emit('update:dateFrom', this.filterState.dateFrom);
            this.$emit('update:dateTo', this.filterState.dateTo);
        },
        removeFilterChip(chip) {
            if (chip.label === this.$t('status')) {
                this.$emit('update:statusFilter', '');
            }
            if (chip.label === this.$t('type')) {
                this.$emit('update:templateKeyFilter', '');
            }
            if (chip.label === this.$t('dateFrom')) {
                this.$emit('update:dateFrom', '');
            }
            if (chip.label === this.$t('dateTo')) {
                this.$emit('update:dateTo', '');
            }
            this.$emit('apply');
        },
    },
};
</script>
