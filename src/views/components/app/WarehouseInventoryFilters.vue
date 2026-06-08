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
          <option value="">{{ $t('allStatuses') }}</option>
          <option value="in_progress">{{ $t('inventoryStatusInProgress') }}</option>
          <option value="completed">{{ $t('inventoryStatusCompleted') }}</option>
        </select>
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
        hasActiveFilters: { type: Boolean, default: false },
        activeFiltersCount: { type: Number, default: 0 },
    },
    emits: ['update:statusFilter', 'reset', 'apply'],
    data() {
        return {
            FILTER_FIELD_ICONS,
        };
    },
    computed: {
        filterState() {
            return { statusFilter: this.statusFilter };
        },
        filterParts() {
            if (!this.statusFilter) {
                return [];
            }
            const label = this.statusFilter === 'in_progress'
                ? this.$t('inventoryStatusInProgress')
                : this.$t('inventoryStatusCompleted');
            return [buildFilterChip('statusFilter', this.$t('status'), label)];
        },
        filterActiveChips() {
            return this.filterParts;
        },
    },
    methods: {
        removeFilterChip(key) {
            if (key !== 'statusFilter') {
                return;
            }
            this.$emit('update:statusFilter', '');
            this.$emit('apply');
        },
        restoreFilterState(snapshot) {
            if (!snapshot) return;
            this.$emit('update:statusFilter', snapshot.statusFilter ?? '');
        },
    },
};
</script>
