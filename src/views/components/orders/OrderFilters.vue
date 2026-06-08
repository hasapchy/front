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
        :label="$t('dateFilter')"
        :icon="FILTER_FIELD_ICONS.date"
      >
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
      </FilterFormField>
      <FilterFormField
        v-if="dateFilter === 'custom'"
        :label="$t('startDate')"
        :icon="FILTER_FIELD_ICONS.startDate"
      >
        <input
          type="date"
          :value="startDate"
          class="w-full"
          @input="$emit('update:startDate', $event.target.value)"
        >
      </FilterFormField>
      <FilterFormField
        v-if="dateFilter === 'custom'"
        :label="$t('endDate')"
        :icon="FILTER_FIELD_ICONS.endDate"
      >
        <input
          type="date"
          :value="endDate"
          class="w-full"
          @input="$emit('update:endDate', $event.target.value)"
        >
      </FilterFormField>
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
            {{ translateOrderStatus(status.name, $t) }}
          </option>
        </select>
      </FilterFormField>
      <FilterFormField
        :label="$t('project')"
        :icon="FILTER_FIELD_ICONS.project"
      >
        <select
          :value="projectFilter"
          class="w-full"
          @input="$emit('update:projectFilter', $event.target.value)"
        >
          <option value="">
            {{ $t('allProjects') }}
          </option>
          <option
            v-for="project in projects"
            :key="project.id"
            :value="project.id"
          >
            {{ project.name }}
          </option>
        </select>
      </FilterFormField>
      <FilterFormField
        :label="$t('filterByCategory')"
        :icon="FILTER_FIELD_ICONS.category"
      >
        <CategorySearch
          :selected-category="selectedCategoryObj"
          :categories="categories"
          :show-label="false"
          :allow-deselect="true"
          @update:selectedCategory="handleCategorySelected"
        />
      </FilterFormField>
      <FilterFormField
        :label="$t('client')"
        :icon="FILTER_FIELD_ICONS.client"
      >
        <ClientSearch
          :selected-client="selectedClientObj"
          :show-label="false"
          :allow-deselect="true"
          inline-selected
          @update:selectedClient="handleClientSelected"
        />
      </FilterFormField>
    </FilterFormSection>
  </FiltersContainer>
</template>

<script>
import FiltersContainer from '@/views/components/app/forms/FiltersContainer.vue';
import FilterFormField from '@/views/components/app/forms/FilterFormField.vue';
import FilterFormSection from '@/views/components/app/forms/FilterFormSection.vue';
import { FILTER_FIELD_ICONS } from '@/constants/filterFormIcons';
import { formatDateFilterSummary, buildFilterChip, buildDateFilterChip } from '@/utils/filterSummaryUtils';
import { translateOrderStatus } from '@/utils/translationUtils';
import ClientSearch from '@/views/components/app/search/ClientSearch.vue';
import CategorySearch from '@/views/components/app/search/CategorySearch.vue';

export default {
    components: { FiltersContainer, FilterFormField, FilterFormSection, ClientSearch, CategorySearch },
    props: {
        dateFilter: { type: String, required: true },
        startDate: { type: String, default: null },
        endDate: { type: String, default: null },
        statusFilter: { type: [String, Number], default: '' },
        projectFilter: { type: [String, Number], default: '' },
        clientFilter: { type: [String, Number], default: '' },
        categoryFilter: { type: [String, Number], default: '' },
        statuses: { type: Array, default: () => [] },
        projects: { type: Array, default: () => [] },
        clients: { type: Array, default: () => [] },
        categories: { type: Array, default: () => [] },
        hasActiveFilters: { type: Boolean, default: false },
        activeFiltersCount: { type: Number, default: 0 },
    },
    emits: [
        'update:dateFilter',
        'update:startDate',
        'update:endDate',
        'update:statusFilter',
        'update:projectFilter',
        'update:categoryFilter',
        'update:clientFilter',
        'reset',
        'apply',
    ],
    data() {
        return {
            FILTER_FIELD_ICONS,
        };
    },
    computed: {
        selectedClientObj() {
            const id = this.clientFilter === '' ? null : this.clientFilter;
            if (!id) return null;
            return (this.clients || []).find(c => String(c.id) === String(id)) || null;
        },
        selectedCategoryObj() {
            const id = this.categoryFilter === '' ? null : this.categoryFilter;
            if (!id) return null;
            return (this.categories || []).find(c => String(c.id) === String(id)) || null;
        },
        filterState() {
            return {
                dateFilter: this.dateFilter,
                startDate: this.startDate,
                endDate: this.endDate,
                statusFilter: this.statusFilter,
                projectFilter: this.projectFilter,
                clientFilter: this.clientFilter,
                categoryFilter: this.categoryFilter,
            };
        },
        filterParts() {
            const parts = [];
            const periodChip = buildDateFilterChip(this.$t, this.dateFilter, this.startDate, this.endDate);
            if (periodChip) {
                parts.push(periodChip);
            }
            if (this.statusFilter) {
                const status = this.statuses.find((item) => String(item.id) === String(this.statusFilter));
                parts.push(buildFilterChip(
                    'statusFilter',
                    this.$t('status'),
                    status ? translateOrderStatus(status.name, this.$t) : this.statusFilter,
                ));
            }
            if (this.projectFilter) {
                const project = this.projects.find((item) => String(item.id) === String(this.projectFilter));
                parts.push(buildFilterChip('projectFilter', this.$t('project'), project?.name || this.projectFilter));
            }
            if (this.selectedCategoryObj) {
                parts.push(buildFilterChip('categoryFilter', this.$t('filterByCategory'), this.selectedCategoryObj.name));
            }
            if (this.selectedClientObj) {
                const name = `${this.selectedClientObj.firstName || ''} ${this.selectedClientObj.lastName || ''}`.trim();
                parts.push(buildFilterChip('clientFilter', this.$t('client'), name));
            }
            return parts;
        },
        filterActiveChips() {
            return this.filterParts;
        },
    },
    methods: {
        translateOrderStatus,
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
            case 'projectFilter':
                this.$emit('update:projectFilter', '');
                break;
            case 'clientFilter':
                this.$emit('update:clientFilter', '');
                break;
            case 'categoryFilter':
                this.$emit('update:categoryFilter', '');
                break;
            default:
                return;
            }
            this.$emit('apply');
        },
        handleClientSelected(newClient) {
            const id = newClient?.id ?? null;
            this.$emit('update:clientFilter', id ? id : '');
        },
        handleCategorySelected(newCategory) {
            const id = newCategory?.id ?? null;
            this.$emit('update:categoryFilter', id ? id : '');
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
            this.$emit('update:dateFilter', snapshot.dateFilter ?? 'all_time');
            this.$emit('update:startDate', snapshot.startDate ?? null);
            this.$emit('update:endDate', snapshot.endDate ?? null);
            this.$emit('update:statusFilter', snapshot.statusFilter ?? '');
            this.$emit('update:projectFilter', snapshot.projectFilter ?? '');
            this.$emit('update:clientFilter', snapshot.clientFilter ?? '');
            this.$emit('update:categoryFilter', snapshot.categoryFilter ?? '');
        },
    },
};
</script>
