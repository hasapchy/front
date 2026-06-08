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
        :label="$t('writeoffReason')"
        :icon="FILTER_FIELD_ICONS.reason"
      >
        <select
          :value="reasonFilter"
          class="w-full"
          @input="$emit('update:reasonFilter', $event.target.value)"
        >
          <option value="">
            {{ $t('allTypes') }}
          </option>
          <option
            v-for="opt in reasonFilterRows"
            :key="opt.value"
            :value="opt.value"
          >
            {{ $t(opt.labelKey) }}
          </option>
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
import { WH_WRITEOFF_REASONS_FOR_WRITE_OFFS_TAB_FILTER } from '@/constants/warehouseWriteoffReasons';
import { buildFilterChip } from '@/utils/filterSummaryUtils';

export default {
    components: { FiltersContainer, FilterFormField, FilterFormSection },
    props: {
        reasonFilter: { type: String, default: '' },
        hasActiveFilters: { type: Boolean, default: false },
        activeFiltersCount: { type: Number, default: 0 },
    },
    emits: ['update:reasonFilter', 'reset', 'apply'],
    data() {
        return {
            FILTER_FIELD_ICONS,
        };
    },
    computed: {
        reasonFilterRows() {
            return WH_WRITEOFF_REASONS_FOR_WRITE_OFFS_TAB_FILTER;
        },
        filterState() {
            return { reasonFilter: this.reasonFilter };
        },
        filterParts() {
            if (!this.reasonFilter) {
                return [];
            }
            const row = this.reasonFilterRows.find((item) => item.value === this.reasonFilter);
            return [buildFilterChip('reasonFilter', this.$t('writeoffReason'), row ? this.$t(row.labelKey) : this.reasonFilter)];
        },
        filterActiveChips() {
            return this.filterParts;
        },
    },
    methods: {
        removeFilterChip(key) {
            if (key !== 'reasonFilter') {
                return;
            }
            this.$emit('update:reasonFilter', '');
            this.$emit('apply');
        },
        restoreFilterState(snapshot) {
            if (!snapshot) return;
            this.$emit('update:reasonFilter', snapshot.reasonFilter ?? '');
        },
    },
};
</script>
