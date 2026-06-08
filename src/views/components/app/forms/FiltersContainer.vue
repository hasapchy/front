<template>

  <div class="inline-flex w-auto shrink-0 items-center justify-start align-middle">

    <div class="inline-flex w-auto items-center gap-2 md:ml-2">

      <div class="relative inline-flex shrink-0 overflow-visible">

        <PrimaryButton

          :onclick="openFiltersModal"

          :is-light="true"

          :title="filterButtonTitle"

          :aria-label="filterButtonTitle"

          :class="filterButtonClass"

          :style="filterButtonStyle"

        >

          <span class="relative inline-flex size-4 shrink-0 items-center justify-center">

            <i class="fas fa-filter text-[12px] leading-none text-[var(--nav-accent)]" aria-hidden="true" />

            <i

              v-if="hasPresetAppearance"

              :class="activePresetAppearance.icon"

              class="absolute -bottom-0.5 -right-1 text-[8px] drop-shadow-sm"

              :style="{ color: activePresetAppearance.color }"

              aria-hidden="true"

            />

          </span>

        </PrimaryButton>

        <span

          v-if="hasActiveFilters && activeFiltersCount > 0"

          class="pointer-events-none absolute -right-1 -top-1.5 z-10 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full border-2 border-white bg-[var(--nav-accent)] px-0.5 text-[10px] font-medium leading-none text-white max-md:-right-0.5 max-md:-top-1 max-md:h-4 max-md:min-w-[1rem] max-md:text-[9px]"

        >{{ activeFiltersCount }}</span>

        <span

          v-else-if="hasActiveFilters"

          class="pointer-events-none absolute -right-0.5 -top-1 z-10 h-2.5 w-2.5 rounded-full border-2 border-white bg-[var(--nav-accent)] max-md:h-2 max-md:w-2"

        />

      </div>



      <PrimaryButton

        v-if="showFilterResetButton"

        :onclick="handleResetClick"

        :is-light="true"

        :title="$t('reset')"

        :aria-label="$t('resetFilters')"

        class="border-[color-mix(in_srgb,var(--color-danger)_50%,var(--border-subtle))] hover:border-[var(--color-danger)] hover:!bg-[color-mix(in_srgb,var(--color-danger)_12%,var(--surface-muted))]"

      >

        <span class="inline-flex size-4 shrink-0 items-center justify-center">

          <i class="fas fa-filter-circle-xmark text-[12px] leading-none text-[var(--color-danger)]" aria-hidden="true" />

        </span>

      </PrimaryButton>

    </div>



    <FiltersModal

      :show="showFiltersModal"

      :show-update-preset="hasFilterPresetsInject && Boolean(filterPresetsPage?.activeFilterPresetValuesChanged)"

      :show-revert-preset="hasFilterPresetsInject && Boolean(filterPresetsPage?.activeFilterPresetValuesChanged)"

      :preset-changed="hasFilterPresetsInject && Boolean(filterPresetsPage?.activeFilterPresetValuesChanged)"

      :has-pending-changes="hasPendingChanges"

      @close-request="requestClose"

      @reset="handleReset"

      @apply="handleApply"

      @update-preset="handleUpdatePreset"

      @revert-preset="handleRevertPreset"

    >

      <ActiveFilterChips
        v-if="filterChips.length"
        :chips="filterChips"
        @remove="handleFilterChipRemove"
      />

      <FilterPresetField v-if="hasFilterPresetsInject" />

      <slot />

    </FiltersModal>



    <FilterPresetSaveDialog

      v-if="hasFilterPresetsInject && filterPresetsPage"

      :visible="filterPresetsPage.filterPresetSaveDialogVisible"

      :name="filterPresetsPage.filterPresetSaveName"

      :icon="filterPresetsPage.filterPresetSaveIcon"

      :color="filterPresetsPage.filterPresetSaveColor"

      :appearance-icons="filterPresetsPage.filterPresetAppearanceIcons"

      :appearance-colors="filterPresetsPage.filterPresetAppearanceColors"

      :saving="filterPresetsPage.filterPresetSaving"

      @update:name="filterPresetsPage.filterPresetSaveName = $event"

      @update:icon="filterPresetsPage.filterPresetSaveIcon = $event"

      @update:color="filterPresetsPage.filterPresetSaveColor = $event"

      @save="filterPresetsPage.saveFilterPreset(

        filterPresetsPage.filterPresetSaveName,

        filterPresetsPage.filterPresetSaveIcon,

        filterPresetsPage.filterPresetSaveColor,

      )"

      @close="closeSaveDialog"

    />



    <AlertDialog

      :dialog="closeConfirmVisible"

      :descr="$t('filtersCloseConfirm')"

      :confirm-text="$t('apply')"

      :leave-text="$t('cancel')"

      :secondary-confirm-text="$t('discard')"

      :on-confirm="handleCloseConfirmApply"

      :on-secondary-confirm="handleCloseConfirmDiscard"

      :on-leave="handleCloseConfirmCancel"

    />

  </div>

</template>



<script>

import FiltersModal from '@/views/components/app/forms/FiltersModal.vue';

import ActiveFilterChips from '@/views/components/app/forms/ActiveFilterChips.vue';

import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';

import FilterPresetField from '@/views/components/app/forms/FilterPresetField.vue';

import FilterPresetSaveDialog from '@/views/components/app/forms/FilterPresetSaveDialog.vue';

import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';

import { FILTER_PRESETS_INJECT_KEY } from '@/constants/filterPresetSources';

import { buildFilterPresetButtonStyle, hasFilterPresetAppearance } from '@/utils/filterPresetAppearanceUtils';



export default {

  name: 'FiltersContainer',

  components: {

    FiltersModal,

    ActiveFilterChips,

    PrimaryButton,

    FilterPresetField,

    FilterPresetSaveDialog,

    AlertDialog,

  },

  inject: {

    filterPresetsPage: {

      from: FILTER_PRESETS_INJECT_KEY,

      default: null,

    },

  },

  props: {

    hasActiveFilters: {

      type: Boolean,

      default: false,

    },

    activeFiltersCount: {

      type: Number,

      default: 0,

    },

    filterState: {

      type: Object,

      default: null,

    },

    filterChips: {

      type: Array,

      default: () => [],

    },

  },

  emits: ['reset', 'apply', 'discard', 'remove-filter-chip'],

  data() {

    return {

      showFiltersModal: false,

      openSnapshot: null,

      closeConfirmVisible: false,

    };

  },

  computed: {

    hasFilterPresetsInject() {

      return this.filterPresetsPage?.filterPresetSource != null;

    },

    hasCustomFilterPreset() {

      return Boolean(this.filterPresetsPage?.hasCustomFilterPreset);

    },

    activeFilterPresetName() {

      return this.filterPresetsPage?.activeFilterPresetName ?? '';

    },

    activePresetAppearance() {

      return this.filterPresetsPage?.activeFilterPresetAppearance ?? { icon: null, color: null };

    },

    hasPresetAppearance() {

      return hasFilterPresetAppearance(this.filterPresetsPage?.activeFilterPreset);

    },

    showFilterResetButton() {

      return this.hasActiveFilters || this.hasCustomFilterPreset;

    },

    filterButtonTitle() {

      if (this.hasCustomFilterPreset && this.activeFilterPresetName) {

        return this.$t('filterPresetActive', { name: this.activeFilterPresetName });

      }

      return this.$t('filters');

    },

    filterButtonClass() {

      if (this.hasPresetAppearance) {

        return '';

      }

      if (this.hasActiveFilters) {

        return 'border-[var(--nav-accent)] bg-[color-mix(in_srgb,var(--nav-accent)_12%,white)] hover:!bg-[color-mix(in_srgb,var(--nav-accent)_20%,white)] dark:bg-[color-mix(in_srgb,var(--nav-accent)_22%,var(--surface-elevated))] dark:hover:!bg-[color-mix(in_srgb,var(--nav-accent)_30%,var(--surface-elevated))]';

      }

      return '';

    },

    filterButtonStyle() {

      if (!this.hasPresetAppearance) {

        return null;

      }

      return buildFilterPresetButtonStyle(this.activePresetAppearance.color);

    },

    hasPendingChanges() {

      if (!this.showFiltersModal || !this.openSnapshot || !this.filterState) {

        return false;

      }

      return JSON.stringify(this.filterState) !== JSON.stringify(this.openSnapshot);

    },

  },

  methods: {

    captureSnapshot() {

      if (!this.filterState) {

        this.openSnapshot = null;

        return;

      }

      this.openSnapshot = JSON.parse(JSON.stringify(this.filterState));

    },

    openFiltersModal() {

      this.showFiltersModal = true;

      this.$nextTick(() => this.captureSnapshot());

    },

    closeModal() {

      this.showFiltersModal = false;

      this.openSnapshot = null;

      this.closeConfirmVisible = false;

    },

    requestClose() {

      if (this.hasPendingChanges) {

        this.closeConfirmVisible = true;

        return;

      }

      this.closeModal();

    },

    handleCloseConfirmApply() {

      this.closeConfirmVisible = false;

      this.handleApply();

    },

    handleCloseConfirmDiscard() {

      this.closeConfirmVisible = false;

      if (this.openSnapshot) {

        this.$emit('discard', JSON.parse(JSON.stringify(this.openSnapshot)));

      }

      this.closeModal();

    },

    handleCloseConfirmCancel() {

      this.closeConfirmVisible = false;

    },

    handleResetClick() {

      this.handleReset();

    },

    handleReset() {

      this.$emit('reset');

      if (this.showFiltersModal) {

        this.$nextTick(() => this.captureSnapshot());

      }

    },

    handleApply() {

      this.$emit('apply');

      this.closeModal();

    },

    handleUpdatePreset() {

      this.filterPresetsPage?.updateActiveFilterPresetFilters?.();

      if (this.showFiltersModal) {

        this.$nextTick(() => this.captureSnapshot());

      }

    },

    handleRevertPreset() {

      this.filterPresetsPage?.revertActiveFilterPreset?.();

      if (this.showFiltersModal) {

        this.$nextTick(() => this.captureSnapshot());

      }

    },

    closeSaveDialog() {

      if (!this.filterPresetsPage) {

        return;

      }

      this.filterPresetsPage.filterPresetSaveDialogVisible = false;

      this.filterPresetsPage.resetFilterPresetSaveAppearance?.();

    },

    handleFilterChipRemove(key) {

      this.$emit('remove-filter-chip', key);

    },

  },

};

</script>


