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
          <option value="active">
            {{ $t('active') }}
          </option>
          <option value="inactive">
            {{ $t('inactive') }}
          </option>
        </select>
      </FilterFormField>
      <FilterFormField
        :label="$t('type')"
        :icon="FILTER_FIELD_ICONS.type"
      >
        <select
          :value="typeFilter"
          class="w-full"
          @input="$emit('update:typeFilter', $event.target.value)"
        >
          <option value="">
            {{ $t('allTypes') }}
          </option>
          <option value="individual">
            {{ $t('individual') }}
          </option>
          <option value="company">
            {{ $t('company') }}
          </option>
          <option value="employee">
            {{ $t('employee') }}
          </option>
          <option value="investor">
            {{ $t('investor') }}
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
import { buildFilterChip } from '@/utils/filterSummaryUtils';

export default {
    components: { FiltersContainer, FilterFormField, FilterFormSection },
    props: {
        statusFilter: { type: String, default: '' },
        typeFilter: { type: String, default: '' },
        hasActiveFilters: { type: Boolean, default: false },
        activeFiltersCount: { type: Number, default: 0 }
    },
    emits: ['update:statusFilter', 'update:typeFilter', 'reset', 'apply'],
    data() {
        return {
            FILTER_FIELD_ICONS,
        };
    },
    computed: {
        filterState() {
            return {
                statusFilter: this.statusFilter,
                typeFilter: this.typeFilter,
            };
        },
        filterParts() {
            const parts = [];
            if (this.statusFilter) {
                parts.push(buildFilterChip('statusFilter', this.$t('status'), this.$t(this.statusFilter)));
            }
            if (this.typeFilter) {
                parts.push(buildFilterChip('typeFilter', this.$t('type'), this.$t(this.typeFilter)));
            }
            return parts;
        },
        filterActiveChips() {
            return this.filterParts;
        },
    },
    methods: {
        removeFilterChip(key) {
            if (key === 'statusFilter') {
                this.$emit('update:statusFilter', '');
            } else if (key === 'typeFilter') {
                this.$emit('update:typeFilter', '');
            } else {
                return;
            }
            this.$emit('apply');
        },
        restoreFilterState(snapshot) {
            if (!snapshot) {
                return;
            }
            this.$emit('update:statusFilter', snapshot.statusFilter ?? '');
            this.$emit('update:typeFilter', snapshot.typeFilter ?? '');
        },
    },
};
</script>
