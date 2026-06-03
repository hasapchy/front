<template>

  <div class="inline-flex w-auto shrink-0 items-center justify-start align-middle">

    <div class="inline-flex w-auto items-center gap-2 md:ml-2">

      <div class="relative inline-flex shrink-0 overflow-visible">
        <PrimaryButton :onclick="openFiltersModal" :is-light="true" :title="$t('filters')" :class="filterButtonClass">
          <i class="fas fa-filter text-[var(--nav-accent)]" aria-hidden="true" />
        </PrimaryButton>
        <span v-if="hasActiveFilters && activeFiltersCount > 0"
          class="pointer-events-none absolute -right-1 -top-1.5 z-10 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full border-2 border-white bg-[var(--nav-accent)] px-0.5 text-[10px] font-medium leading-none text-white max-md:-right-0.5 max-md:-top-1 max-md:h-4 max-md:min-w-[1rem] max-md:text-[9px]">{{
            activeFiltersCount }}</span>
        <span v-else-if="hasActiveFilters"
          class="pointer-events-none absolute -right-0.5 -top-1 z-10 h-2.5 w-2.5 rounded-full border-2 border-white bg-[var(--nav-accent)] max-md:h-2 max-md:w-2" />
      </div>

      <PrimaryButton v-if="hasActiveFilters" :onclick="handleResetClick" :is-light="true" :title="$t('reset')"
        class="border-red-400 hover:border-red-500 hover:!bg-red-50">

        <i class="fas fa-filter-circle-xmark text-red-600" />

      </PrimaryButton>

    </div>



    <FiltersModal :show="showFiltersModal" @close="showFiltersModal = false" @reset="handleReset" @apply="handleApply">

      <slot />

    </FiltersModal>

  </div>

</template>



<script>

import FiltersModal from '@/views/components/app/forms/FiltersModal.vue';

import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';



export default {

  name: 'FiltersContainer',

  components: {

    FiltersModal,

    PrimaryButton

  },

  props: {

    hasActiveFilters: {

      type: Boolean,

      default: false

    },

    activeFiltersCount: {

      type: Number,

      default: 0

    }

  },

  emits: ['reset', 'apply'],

  data() {

    return {

      showFiltersModal: false

    };

  },

  computed: {

    filterButtonClass() {
      if (this.hasActiveFilters) {
        return 'border-[var(--nav-accent)] bg-[color-mix(in_srgb,var(--nav-accent)_12%,white)] hover:!bg-[color-mix(in_srgb,var(--nav-accent)_20%,white)] dark:bg-[color-mix(in_srgb,var(--nav-accent)_22%,var(--surface-elevated))] dark:hover:!bg-[color-mix(in_srgb,var(--nav-accent)_30%,var(--surface-elevated))]';
      }
      return '';
    }

  },

  methods: {
    openFiltersModal() {
      this.showFiltersModal = true;
    },

    handleResetClick() {

      this.handleReset();

    },

    handleReset() {

      this.showFiltersModal = false;

      this.$emit('reset');

    },

    handleApply() {

      this.showFiltersModal = false;

      this.$emit('apply');

    }

  }

}

</script>
