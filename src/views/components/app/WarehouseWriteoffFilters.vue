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
        <option value="defect">
          {{ $t('writeoffReasonDefect') }}
        </option>
        <option value="shortage">
          {{ $t('writeoffReasonShortage') }}
        </option>
        <option value="consumable">
          {{ $t('writeoffReasonConsumable') }}
        </option>
        <option value="return_supplier">
          {{ $t('writeoffReasonReturnSupplier') }}
        </option>
        <option value="other">
          {{ $t('writeoffReasonOther') }}
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
        reasonFilter: { type: String, default: '' },
        hasActiveFilters: { type: Boolean, default: false },
        activeFiltersCount: { type: Number, default: 0 },
    },
    emits: ['update:reasonFilter', 'reset', 'apply'],
};
</script>
