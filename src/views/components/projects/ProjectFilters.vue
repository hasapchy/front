<template>
  <FiltersContainer
    :has-active-filters="hasActiveFilters"
    :active-filters-count="activeFiltersCount"
    :filter-state="filterState"
    :filter-chips="filterActiveChips"
    @reset="resetFilters"
    @apply="applyFilters"
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
          <option
            v-for="status in statuses"
            :key="status.id"
            :value="status.id"
          >
            {{ translateTaskStatus(status.name, $t) }}
          </option>
        </select>
      </FilterFormField>
      <FilterFormField
        :label="$t('client')"
        :icon="FILTER_FIELD_ICONS.client"
      >
        <select
          :value="clientFilter"
          class="w-full"
          @input="$emit('update:clientFilter', $event.target.value)"
        >
          <option value="">
            {{ $t('allClients') }}
          </option>
          <option
            v-for="client in clients"
            :key="client.id"
            :value="client.id"
          >
            {{ client.firstName }} {{ client.lastName }}
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
import { translateTaskStatus } from '@/utils/translationUtils';

export default {
    components: { FiltersContainer, FilterFormField, FilterFormSection },
    props: {
        statusFilter: { type: [String, Number], default: '' },
        clientFilter: { type: [String, Number], default: '' },
        statuses: { type: Array, default: () => [] },
        clients: { type: Array, default: () => [] },
        hasActiveFilters: { type: Boolean, default: false },
        activeFiltersCount: { type: Number, default: 0 },
    },
    emits: ['update:statusFilter', 'update:clientFilter', 'reset', 'apply'],
    data() {
        return {
            FILTER_FIELD_ICONS,
        };
    },
    computed: {
        filterState() {
            return {
                statusFilter: this.statusFilter,
                clientFilter: this.clientFilter,
            };
        },
        filterParts() {
            const parts = [];
            if (this.statusFilter) {
                const status = this.statuses.find((item) => String(item.id) === String(this.statusFilter));
                parts.push(buildFilterChip(
                    'statusFilter',
                    this.$t('status'),
                    status ? translateTaskStatus(status.name, this.$t) : this.statusFilter,
                ));
            }
            if (this.clientFilter) {
                const client = this.clients.find((item) => String(item.id) === String(this.clientFilter));
                const name = client ? `${client.firstName} ${client.lastName}`.trim() : this.clientFilter;
                parts.push(buildFilterChip('clientFilter', this.$t('client'), name));
            }
            return parts;
        },
        filterActiveChips() {
            return this.filterParts;
        },
    },
    methods: {
        translateTaskStatus,
        removeFilterChip(key) {
            if (key === 'statusFilter') {
                this.$emit('update:statusFilter', '');
            } else if (key === 'clientFilter') {
                this.$emit('update:clientFilter', '');
            } else {
                return;
            }
            this.$emit('apply');
        },
        resetFilters() {
            this.$emit('reset');
        },
        applyFilters() {
            this.$emit('apply');
        },
        restoreFilterState(snapshot) {
            if (!snapshot) {
                return;
            }
            this.$emit('update:statusFilter', snapshot.statusFilter ?? '');
            this.$emit('update:clientFilter', snapshot.clientFilter ?? '');
        },
    },
};
</script>
