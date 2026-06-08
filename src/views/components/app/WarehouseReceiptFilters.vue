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
        :label="$t('dateFilter')"
        :icon="FILTER_FIELD_ICONS.date"
      >
        <select
          :value="dateFilter"
          class="w-full"
          @input="$emit('update:dateFilter', $event.target.value)"
        >
          <option value="all_time">{{ $t('allTime') }}</option>
          <option value="today">{{ $t('today') }}</option>
          <option value="yesterday">{{ $t('yesterday') }}</option>
          <option value="this_week">{{ $t('thisWeek') }}</option>
          <option value="this_month">{{ $t('thisMonth') }}</option>
          <option value="last_week">{{ $t('lastWeek') }}</option>
          <option value="last_month">{{ $t('lastMonth') }}</option>
          <option value="custom">{{ $t('selectDates') }}</option>
        </select>
      </FilterFormField>
      <FilterFormField
        v-if="dateFilter === 'custom'"
        :label="$t('startDate')"
        :icon="FILTER_FIELD_ICONS.startDate"
      >
        <input
          type="date"
          :value="startDate || ''"
          class="w-full"
          @input="$emit('update:startDate', $event.target.value || null)"
        >
      </FilterFormField>
      <FilterFormField
        v-if="dateFilter === 'custom'"
        :label="$t('endDate')"
        :icon="FILTER_FIELD_ICONS.endDate"
      >
        <input
          type="date"
          :value="endDate || ''"
          class="w-full"
          @input="$emit('update:endDate', $event.target.value || null)"
        >
      </FilterFormField>
      <FilterFormField
        :label="$t('receiptStatus')"
        :icon="FILTER_FIELD_ICONS.status"
      >
        <select
          :value="statusFilter"
          class="w-full"
          @input="$emit('update:statusFilter', $event.target.value)"
        >
          <option value="">{{ $t('allStatuses') }}</option>
          <option value="draft">{{ $t('receiptStatusDraft') }}</option>
          <option value="completed">{{ $t('receiptStatusCompleted') }}</option>
        </select>
      </FilterFormField>
      <FilterFormField
        :label="$t('warehouse')"
        :icon="FILTER_FIELD_ICONS.warehouse"
      >
        <select
          :value="warehouseIdFilter"
          class="w-full"
          @input="$emit('update:warehouseIdFilter', $event.target.value)"
        >
          <option value="">{{ $t('allWarehouses') }}</option>
          <option
            v-for="w in warehouses"
            :key="w.id"
            :value="String(w.id)"
          >
            {{ w.name }}
          </option>
        </select>
      </FilterFormField>
      <FilterFormField
        :label="$t('product')"
        :icon="FILTER_FIELD_ICONS.product"
      >
        <select
          :value="productIdFilter"
          class="w-full"
          @input="$emit('update:productIdFilter', $event.target.value)"
        >
          <option value="">{{ $t('allProducts') }}</option>
          <option
            v-for="p in sortedProducts"
            :key="p.id"
            :value="String(p.id)"
          >
            {{ p.name }}
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
import { buildFilterChip, buildDateFilterChip } from '@/utils/filterSummaryUtils';

export default {
    components: { FiltersContainer, FilterFormField, FilterFormSection },
    props: {
        dateFilter: { type: String, default: 'all_time' },
        startDate: { type: String, default: null },
        endDate: { type: String, default: null },
        statusFilter: { type: String, default: '' },
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
        'update:warehouseIdFilter',
        'update:productIdFilter',
        'reset',
        'apply',
    ],
    data() {
        return {
            FILTER_FIELD_ICONS,
        };
    },
    computed: {
        warehouses() {
            return this.$store.getters.warehouses || [];
        },
        sortedProducts() {
            const list = this.$store.getters.allProducts || [];
            return [...list].sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), undefined, { sensitivity: 'base' }));
        },
        filterState() {
            return {
                dateFilter: this.dateFilter,
                startDate: this.startDate,
                endDate: this.endDate,
                statusFilter: this.statusFilter,
                warehouseIdFilter: this.warehouseIdFilter,
                productIdFilter: this.productIdFilter,
            };
        },
        filterParts() {
            const parts = [];
            const periodChip = buildDateFilterChip(this.$t, this.dateFilter, this.startDate, this.endDate);
            if (periodChip) {
                parts.push(periodChip);
            }
            if (this.statusFilter) {
                const statusLabel = this.statusFilter === 'draft'
                    ? this.$t('receiptStatusDraft')
                    : this.$t('receiptStatusCompleted');
                parts.push(buildFilterChip('statusFilter', this.$t('receiptStatus'), statusLabel));
            }
            if (this.warehouseIdFilter) {
                const warehouse = this.warehouses.find((item) => String(item.id) === String(this.warehouseIdFilter));
                parts.push(buildFilterChip('warehouseIdFilter', this.$t('warehouse'), warehouse?.name || this.warehouseIdFilter));
            }
            if (this.productIdFilter) {
                const product = this.sortedProducts.find((item) => String(item.id) === String(this.productIdFilter));
                parts.push(buildFilterChip('productIdFilter', this.$t('product'), product?.name || this.productIdFilter));
            }
            return parts;
        },
        filterActiveChips() {
            return this.filterParts;
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
    methods: {
        removeFilterChip(key) {
            switch (key) {
            case 'dateFilter':
                this.$emit('update:dateFilter', 'all_time');
                this.$emit('update:startDate', null);
                this.$emit('update:endDate', null);
                break;
            case 'statusFilter':
                this.$emit('update:statusFilter', '');
                break;
            case 'warehouseIdFilter':
                this.$emit('update:warehouseIdFilter', '');
                break;
            case 'productIdFilter':
                this.$emit('update:productIdFilter', '');
                break;
            default:
                return;
            }
            this.$emit('apply');
        },
        restoreFilterState(snapshot) {
            if (!snapshot) return;
            this.$emit('update:dateFilter', snapshot.dateFilter ?? 'all_time');
            this.$emit('update:startDate', snapshot.startDate ?? null);
            this.$emit('update:endDate', snapshot.endDate ?? null);
            this.$emit('update:statusFilter', snapshot.statusFilter ?? '');
            this.$emit('update:warehouseIdFilter', snapshot.warehouseIdFilter ?? '');
            this.$emit('update:productIdFilter', snapshot.productIdFilter ?? '');
        },
    },
};
</script>
