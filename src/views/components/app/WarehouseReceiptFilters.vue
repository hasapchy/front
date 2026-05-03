<template>
  <FiltersContainer
    :has-active-filters="hasActiveFilters"
    :active-filters-count="activeFiltersCount"
    @reset="$emit('reset')"
    @apply="$emit('apply')"
  >
    <div>
      <label class="mb-2 block text-xs font-semibold">{{ $t('dateFilter') }}</label>
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
    </div>

    <div
      v-if="dateFilter === 'custom'"
      class="space-y-2"
    >
      <div>
        <label class="mb-2 block text-xs font-semibold">{{ $t('startDate') }}</label>
        <input
          type="date"
          :value="startDate || ''"
          class="w-full"
          @input="$emit('update:startDate', $event.target.value || null)"
        >
      </div>
      <div>
        <label class="mb-2 block text-xs font-semibold">{{ $t('endDate') }}</label>
        <input
          type="date"
          :value="endDate || ''"
          class="w-full"
          @input="$emit('update:endDate', $event.target.value || null)"
        >
      </div>
    </div>

    <div>
      <label class="mb-2 block text-xs font-semibold">{{ $t('receiptStatus') }}</label>
      <select
        :value="statusFilter"
        class="w-full"
        @input="$emit('update:statusFilter', $event.target.value)"
      >
        <option value="">
          {{ $t('allStatuses') }}
        </option>
        <option value="in_transit">
          {{ $t('receiptStatusInTransit') }}
        </option>
        <option value="customs_clearance">
          {{ $t('receiptStatusCustoms') }}
        </option>
        <option value="purchasing">
          {{ $t('receiptStatusPurchasing') }}
        </option>
        <option value="fully_received">
          {{ $t('receiptStatusFullyReceived') }}
        </option>
        <option value="completed">
          {{ $t('receiptStatusCompleted') }}
        </option>
      </select>
    </div>
    <div>
      <label class="mb-2 block text-xs font-semibold">{{ $t('receiptPostingType') }}</label>
      <select
        :value="postingTypeFilter"
        class="w-full"
        @input="$emit('update:postingTypeFilter', $event.target.value)"
      >
        <option value="">
          {{ $t('allTypes') }}
        </option>
        <option value="quick">
          {{ $t('receiptPostingTypeQuick') }}
        </option>
        <option value="standard">
          {{ $t('receiptPostingTypeStandard') }}
        </option>
      </select>
    </div>
    <div>
      <label class="mb-2 block text-xs font-semibold">{{ $t('warehouse') }}</label>
      <select
        :value="warehouseIdFilter"
        class="w-full"
        @input="$emit('update:warehouseIdFilter', $event.target.value)"
      >
        <option value="">
          {{ $t('allWarehouses') }}
        </option>
        <option
          v-for="w in warehouses"
          :key="w.id"
          :value="String(w.id)"
        >
          {{ w.name }}
        </option>
      </select>
    </div>
    <div>
      <label class="mb-2 block text-xs font-semibold">{{ $t('product') }}</label>
      <select
        :value="productIdFilter"
        class="w-full"
        @input="$emit('update:productIdFilter', $event.target.value)"
      >
        <option value="">
          {{ $t('allProducts') }}
        </option>
        <option
          v-for="p in sortedProducts"
          :key="p.id"
          :value="String(p.id)"
        >
          {{ p.name }}
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
        dateFilter: { type: String, default: 'all_time' },
        startDate: { type: String, default: null },
        endDate: { type: String, default: null },
        statusFilter: { type: String, default: '' },
        postingTypeFilter: { type: String, default: '' },
        warehouseIdFilter: { type: String, default: '' },
        productIdFilter: { type: String, default: '' },
        hasActiveFilters: { type: Boolean, default: false },
        activeFiltersCount: { type: Number, default: 0 },
    },
    emits: [
        'update:dateFilter',
        'update:startDate',
        'update:endDate',
        'update:statusFilter',
        'update:postingTypeFilter',
        'update:warehouseIdFilter',
        'update:productIdFilter',
        'reset',
        'apply',
    ],
    computed: {
        warehouses() {
            return this.$store.getters.warehouses || [];
        },
        sortedProducts() {
            const list = this.$store.getters.allProducts || [];
            return [...list].sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), undefined, { sensitivity: 'base' }));
        },
    },
    async mounted() {
        if (!this.$store.getters.warehouses?.length) {
            await this.$store.dispatch('loadWarehouses');
        }
        if (!this.$store.getters.allProducts?.length) {
            await this.$store.dispatch('loadAllProducts');
        }
    },
};
</script>
