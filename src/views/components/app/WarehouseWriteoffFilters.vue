<template>
  <FiltersContainer
    :has-active-filters="hasActiveFilters"
    :active-filters-count="activeFiltersCount"
    @reset="$emit('reset')"
    @apply="$emit('apply')"
  >
    <div>
      <label class="mb-2 block text-xs font-semibold">{{ $t('writeoffReason') }}</label>
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
    </div>
  </FiltersContainer>
</template>

<script>
import FiltersContainer from '@/views/components/app/forms/FiltersContainer.vue';
import { WH_WRITEOFF_REASONS_FOR_WRITE_OFFS_TAB_FILTER } from '@/constants/warehouseWriteoffReasons';

export default {
    components: { FiltersContainer },
    props: {
        reasonFilter: { type: String, default: '' },
        hasActiveFilters: { type: Boolean, default: false },
        activeFiltersCount: { type: Number, default: 0 },
    },
    emits: ['update:reasonFilter', 'reset', 'apply'],
    computed: {
        reasonFilterRows() {
            return WH_WRITEOFF_REASONS_FOR_WRITE_OFFS_TAB_FILTER;
        },
    },
};
</script>
