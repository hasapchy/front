<template>

  <div class="flex justify-start items-center">

    <div class="flex items-center gap-2 md:ml-2">

      <PrimaryButton

        :onclick="openFiltersModal"

        :is-light="true"

        :title="$t('filters')"

        :class="filterButtonClass"

      >

        <i :class="[hasActiveFilters ? 'fas fa-filter-circle' : 'fas fa-filter', 'text-[var(--nav-accent)]']" />

        <span

          v-if="hasActiveFilters"

          class="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-[var(--nav-accent)] max-md:-right-0.5 max-md:-top-0.5 max-md:h-2 max-md:w-2"

        />

        <span

          v-if="hasActiveFilters && activeFiltersCount > 0"

          class="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[var(--nav-accent)] text-xs text-white max-md:-right-0.5 max-md:-top-0.5 max-md:h-4 max-md:w-4 max-md:text-[10px]"

        >{{ activeFiltersCount }}</span>

      </PrimaryButton>

      <PrimaryButton

        v-if="hasActiveFilters"

        :onclick="handleResetClick"

        :is-light="true"

        :title="$t('reset')"

        class="border-red-400 hover:border-red-500 hover:!bg-red-50"

      >

        <i class="fas fa-filter-circle-xmark text-red-600" />

      </PrimaryButton>

    </div>



    <FiltersModal

      :show="showFiltersModal"

      @close="showFiltersModal = false"

      @reset="handleReset"

      @apply="handleApply"

    >

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

            const base = 'relative';

            if (this.hasActiveFilters) {

                return [base, 'border-[var(--nav-accent)] bg-[color-mix(in_srgb,var(--nav-accent)_12%,white)] hover:!bg-[color-mix(in_srgb,var(--nav-accent)_20%,white)] dark:bg-[color-mix(in_srgb,var(--nav-accent)_22%,var(--surface-elevated))] dark:hover:!bg-[color-mix(in_srgb,var(--nav-accent)_30%,var(--surface-elevated))]'];

            }

            return base;

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

