<template>
  <FiltersContainer
    :has-active-filters="hasActiveFilters"
    :active-filters-count="activeFiltersCount"
    @reset="$emit('reset')"
    @apply="$emit('apply')"
  >
    <div>
      <label class="mb-2 block text-xs font-semibold">{{ $t('status') }}</label>
      <select
        :value="statusFilter"
        class="w-full"
        @input="$emit('update:statusFilter', $event.target.value)"
      >
        <option value="">
          {{ $t('allStatuses') }}
        </option>
        <option value="in_progress">
          {{ $t('inventoryStatusInProgress') }}
        </option>
        <option value="completed">
          {{ $t('inventoryStatusCompleted') }}
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
        statusFilter: { type: String, default: '' },
        hasActiveFilters: { type: Boolean, default: false },
        activeFiltersCount: { type: Number, default: 0 },
    },
    emits: ['update:statusFilter', 'reset', 'apply'],
};
</script>
