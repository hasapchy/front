<template>
  <FiltersContainer
    :has-active-filters="hasActiveFilters"
    :active-filters-count="activeFiltersCount"
    @reset="resetFilters"
    @apply="applyFilters"
  >
    <div>
      <label class="block mb-2 text-xs font-semibold">{{ $t('dateFilter') }}</label>
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
        <label class="block mb-2 text-xs font-semibold">{{ $t('startDate') }}</label>
        <input
          type="date"
          :value="startDate"
          class="w-full"
          @input="$emit('update:startDate', $event.target.value)"
        >
      </div>
      <div>
        <label class="block mb-2 text-xs font-semibold">{{ $t('endDate') }}</label>
        <input
          type="date"
          :value="endDate"
          class="w-full"
          @input="$emit('update:endDate', $event.target.value)"
        >
      </div>
    </div>

    <div>
      <label class="block mb-2 text-xs font-semibold">{{ $t('status') }}</label>
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
    </div>

    <div>
      <label class="block mb-2 text-xs font-semibold">{{ $t('project') }}</label>
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
    </div>

    <div>
      <label class="block mb-2 text-xs font-semibold">{{ $t('filterByCategory') }}</label>
      <CategorySearch
        :selected-category="selectedCategoryObj"
        :categories="categories"
        :show-label="false"
        :allow-deselect="true"
        inline-selected
        @update:selectedCategory="handleCategorySelected"
      />
    </div>

    <div>
      <label class="block mb-2 text-xs font-semibold">{{ $t('client') }}</label>
      <ClientSearch
        :selected-client="selectedClientObj"
        :show-label="false"
        :allow-deselect="true"
        inline-selected
        @update:selectedClient="handleClientSelected"
      />
    </div>
  </FiltersContainer>
</template>

<script>
import FiltersContainer from '@/views/components/app/forms/FiltersContainer.vue';
import { translateOrderStatus } from '@/utils/translationUtils';
import ClientSearch from '@/views/components/app/search/ClientSearch.vue';
import CategorySearch from '@/views/components/app/search/CategorySearch.vue';

export default {
    components: { FiltersContainer, ClientSearch, CategorySearch },
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
    methods: {
        translateOrderStatus,
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
    },
};
</script>

