<template>
  <FiltersContainer
    :has-active-filters="hasActiveFilters"
    :active-filters-count="activeFiltersCount"
    @reset="$emit('reset')"
    @apply="$emit('apply')"
  >
    <div>
      <label class="mb-2 block text-xs font-semibold">{{ $t('warehouse') }}</label>
      <select
        :value="warehouseId"
        class="w-full"
        @input="$emit('update:warehouseId', $event.target.value)"
      >
        <option value="">
          {{ $t('allWarehouses') }}
        </option>
        <option
          v-for="warehouse in allWarehouses"
          :key="warehouse.id"
          :value="String(warehouse.id)"
        >
          {{ warehouse.name }}
        </option>
      </select>
    </div>
    <div>
      <label class="mb-2 block text-xs font-semibold">{{ $t('category') }}</label>
      <select
        :value="categoryId"
        class="w-full"
        @input="$emit('update:categoryId', $event.target.value)"
      >
        <option value="">
          {{ $t('allCategories') }}
        </option>
        <option
          v-for="category in allCategories"
          :key="category.id"
          :value="String(category.id)"
        >
          {{ category.name }}
        </option>
      </select>
    </div>
    <div>
      <label class="mb-2 block text-xs font-semibold">{{ $t('availability') }}</label>
      <select
        :value="availabilityFilter"
        class="w-full"
        @input="$emit('update:availabilityFilter', $event.target.value)"
      >
        <option value="all">
          {{ $t('allProducts') }}
        </option>
        <option value="in_stock">
          {{ $t('inStock') }}
        </option>
        <option value="out_of_stock">
          {{ $t('outOfStock') }}
        </option>
      </select>
    </div>
  </FiltersContainer>
</template>

<script>
import FiltersContainer from '@/views/components/app/forms/FiltersContainer.vue';

export default {
    components: { FiltersContainer },
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
};
</script>
