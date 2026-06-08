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
        :label="$t('warehouse')"
        :icon="FILTER_FIELD_ICONS.warehouse"
      >
        <select
          :value="warehouseId"
          class="w-full"
          @input="$emit('update:warehouseId', $event.target.value)"
        >
          <option value="">{{ $t('allWarehouses') }}</option>
          <option
            v-for="warehouse in allWarehouses"
            :key="warehouse.id"
            :value="String(warehouse.id)"
          >
            {{ warehouse.name }}
          </option>
        </select>
      </FilterFormField>
      <FilterFormField
        :label="$t('category')"
        :icon="FILTER_FIELD_ICONS.category"
      >
        <select
          :value="categoryId"
          class="w-full"
          @input="$emit('update:categoryId', $event.target.value)"
        >
          <option value="">{{ $t('allCategories') }}</option>
          <option
            v-for="category in allCategories"
            :key="category.id"
            :value="String(category.id)"
          >
            {{ category.name }}
          </option>
        </select>
      </FilterFormField>
      <FilterFormField
        :label="$t('availability')"
        :icon="FILTER_FIELD_ICONS.availability"
      >
        <select
          :value="availabilityFilter"
          class="w-full"
          @input="$emit('update:availabilityFilter', $event.target.value)"
        >
          <option value="all">{{ $t('allProducts') }}</option>
          <option value="in_stock">{{ $t('inStock') }}</option>
          <option value="out_of_stock">{{ $t('outOfStock') }}</option>
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
        warehouseId: { type: [String, Number], default: '' },
        categoryId: { type: [String, Number], default: '' },
        availabilityFilter: { type: String, default: 'all' },
        allWarehouses: { type: Array, default: () => [] },
        allCategories: { type: Array, default: () => [] },
        hasActiveFilters: { type: Boolean, default: false },
        activeFiltersCount: { type: Number, default: 0 },
    },
    emits: ['update:warehouseId', 'update:categoryId', 'update:availabilityFilter', 'reset', 'apply'],
    data() {
        return {
            FILTER_FIELD_ICONS,
        };
    },
    computed: {
        filterState() {
            return {
                warehouseId: this.warehouseId,
                categoryId: this.categoryId,
                availabilityFilter: this.availabilityFilter,
            };
        },
        filterParts() {
            const parts = [];
            if (this.warehouseId) {
                const warehouse = this.allWarehouses.find((item) => String(item.id) === String(this.warehouseId));
                parts.push(buildFilterChip('warehouseId', this.$t('warehouse'), warehouse?.name || this.warehouseId));
            }
            if (this.categoryId) {
                const category = this.allCategories.find((item) => String(item.id) === String(this.categoryId));
                parts.push(buildFilterChip('categoryId', this.$t('category'), category?.name || this.categoryId));
            }
            if (this.availabilityFilter && this.availabilityFilter !== 'all') {
                parts.push(buildFilterChip(
                    'availabilityFilter',
                    this.$t('availability'),
                    this.$t(this.availabilityFilter === 'in_stock' ? 'inStock' : 'outOfStock'),
                ));
            }
            return parts;
        },
        filterActiveChips() {
            return this.filterParts;
        },
    },
    methods: {
        removeFilterChip(key) {
            switch (key) {
            case 'warehouseId':
                this.$emit('update:warehouseId', '');
                break;
            case 'categoryId':
                this.$emit('update:categoryId', '');
                break;
            case 'availabilityFilter':
                this.$emit('update:availabilityFilter', 'all');
                break;
            default:
                return;
            }
            this.$emit('apply');
        },
        restoreFilterState(snapshot) {
            if (!snapshot) return;
            this.$emit('update:warehouseId', snapshot.warehouseId ?? '');
            this.$emit('update:categoryId', snapshot.categoryId ?? '');
            this.$emit('update:availabilityFilter', snapshot.availabilityFilter ?? 'all');
        },
    },
};
</script>
