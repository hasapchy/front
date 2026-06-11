<template>
  <div class="filter-preset-card mb-4 space-y-2">
    <label>{{ $t('filterPresetDefault') }}</label>
    <div class="flex items-stretch gap-2">
      <AppFieldPicker
        ref="picker"
        class="min-w-0 flex-1"
        :has-selection="false"
        :searchable="false"
        :show-label="false"
        :allow-deselect="false"
        :dropdown-open="open"
      >
      <template #trigger>
        <button
          type="button"
          class="custom-dropdown-button gap-2"
          :style="selectedHasAppearance ? { borderColor: selectedAppearance.color } : undefined"
          @click="toggleOpen"
        >
          <span class="flex min-w-0 flex-1 items-center gap-2 text-left">
            <span
              class="filter-modal-icon-badge"
              aria-hidden="true"
            >
              <i
                v-if="selectedHasAppearance"
                :class="selectedAppearance.icon"
                :style="{ color: selectedAppearance.color }"
              />
              <i
                v-else
                :class="FILTER_PRESET_SYSTEM_ICON"
              />
            </span>
            <span class="truncate">{{ selectedLabel }}</span>
          </span>
          <i
            class="fas fa-chevron-down shrink-0 text-[10px] opacity-70 transition-transform"
            :class="open ? 'rotate-180' : ''"
          />
        </button>
      </template>
      <template #dropdown>
        <li
          class="app-field-picker__option"
          :class="{ 'app-field-picker__option--selected': !selectedId }"
          @mousedown.prevent="selectSystemDefault"
        >
          <div class="app-field-picker__option-row">
            <div class="app-field-picker__option-leading min-w-0 flex-1">
              <span class="filter-modal-icon-badge" aria-hidden="true">
                <i :class="FILTER_PRESET_SYSTEM_ICON" />
              </span>
              <span class="app-field-picker__option-primary">{{ $t('filterPresetDefaultNone') }}</span>
            </div>
          </div>
        </li>
        <li
          v-for="preset in presets"
          :key="preset.id"
          class="app-field-picker__option"
          :class="{ 'app-field-picker__option--selected': preset.id === selectedId }"
        >
          <div class="app-field-picker__option-row">
            <div
              class="app-field-picker__option-leading min-w-0 flex-1 cursor-pointer"
              @mousedown.prevent="selectPreset(preset)"
            >
              <span
                v-if="presetHasAppearance(preset)"
                class="filter-modal-icon-badge"
                aria-hidden="true"
              >
                <i
                  :class="presetAppearance(preset).icon"
                  :style="{ color: presetAppearance(preset).color }"
                />
              </span>
              <span class="app-field-picker__option-primary">{{ preset.name }}</span>
            </div>
            <span
              class="flex shrink-0 items-center gap-1"
              @mousedown.stop
            >
              <button
                type="button"
                class="flex h-7 w-7 items-center justify-center rounded transition-colors hover:bg-gray-100 dark:hover:bg-[var(--surface-muted)]"
                :title="$t('filterPresetEditAppearance')"
                @click="openEdit(preset)"
              >
                <span class="filter-modal-icon-badge filter-modal-icon-badge--sm">
                  <i class="fas fa-palette" />
                </span>
              </button>
              <button
                type="button"
                class="flex h-7 w-7 items-center justify-center rounded transition-colors hover:bg-[color-mix(in_srgb,var(--color-danger)_12%,var(--surface-muted))] dark:hover:bg-[color-mix(in_srgb,var(--color-danger)_22%,transparent)]"
                :title="$t('delete')"
                @click="openDeleteConfirm(preset)"
              >
                <span class="filter-modal-icon-badge filter-modal-icon-badge--sm">
                  <i class="fas fa-trash text-[var(--color-danger)]" />
                </span>
              </button>
            </span>
          </div>
        </li>
      </template>
      </AppFieldPicker>
      <PrimaryButton
        :onclick="openCreatePreset"
        icon="fas fa-plus"
        :title="$t('createFilterPreset')"
        :aria-label="$t('createFilterPreset')"
        class="shrink-0"
      />
    </div>

    <FilterPresetSaveDialog
      :visible="editDialogVisible"
      :title="$t('editFilterPreset')"
      :name="editName"
      :icon="editIcon"
      :color="editColor"
      :appearance-icons="appearanceIcons"
      :appearance-colors="appearanceColors"
      :saving="editSaving"
      @update:name="editName = $event"
      @update:icon="editIcon = $event"
      @update:color="editColor = $event"
      @save="handleEditSave"
      @close="closeEditDialog"
    />

    <AlertDialog
      :dialog="deleteDialogVisible"
      :descr="$t('confirmDelete')"
      :confirm-text="$t('delete')"
      :leave-text="$t('cancel')"
      :on-confirm="handleDeleteConfirm"
      :on-leave="closeDeleteDialog"
    />
  </div>
</template>

<script>
import AppFieldPicker from '@/views/components/app/forms/AppFieldPicker.vue';
import FilterPresetSaveDialog from '@/views/components/app/forms/FilterPresetSaveDialog.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import { FILTER_PRESETS_INJECT_KEY } from '@/constants/filterPresetSources';
import { FILTER_PRESET_SYSTEM_ICON } from '@/constants/filterPresetUi';
import { hasFilterPresetAppearance, resolveFilterPresetAppearance } from '@/utils/filterPresetAppearanceUtils';

export default {
  name: 'FilterPresetField',
  components: { AppFieldPicker, FilterPresetSaveDialog, AlertDialog, PrimaryButton },
  inject: {
    filterPresetsPage: {
      from: FILTER_PRESETS_INJECT_KEY,
      default: null,
    },
  },
  data() {
    return {
      open: false,
      editDialogVisible: false,
      editName: '',
      editIcon: '',
      editColor: '',
      editPresetId: null,
      editSaving: false,
      deleteDialogVisible: false,
      deletePresetId: null,
      FILTER_PRESET_SYSTEM_ICON,
    };
  },
  computed: {
    presets() {
      return this.filterPresetsPage?.filterPresets ?? [];
    },
    selectedId() {
      return this.filterPresetsPage?.defaultFilterPresetId ?? null;
    },
    appearanceIcons() {
      return this.filterPresetsPage?.filterPresetAppearanceIcons ?? [];
    },
    appearanceColors() {
      return this.filterPresetsPage?.filterPresetAppearanceColors ?? [];
    },
    selectedLabel() {
      if (!this.selectedId) {
        return this.$t('filterPresetDefaultNone');
      }
      const preset = this.presets.find((item) => item.id === this.selectedId);
      return preset?.name ?? this.$t('filterPresetDefaultNone');
    },
    selectedHasAppearance() {
      if (!this.selectedId) {
        return false;
      }
      const preset = this.presets.find((item) => item.id === this.selectedId);
      return hasFilterPresetAppearance(preset);
    },
    selectedAppearance() {
      if (!this.selectedId) {
        return { icon: null, color: null };
      }
      const preset = this.presets.find((item) => item.id === this.selectedId);
      return resolveFilterPresetAppearance(preset);
    },
  },
  mounted() {
    document.addEventListener('click', this.handleOutsideClick);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleOutsideClick);
  },
  methods: {
    presetAppearance(preset) {
      return resolveFilterPresetAppearance(preset);
    },
    presetHasAppearance(preset) {
      return hasFilterPresetAppearance(preset);
    },
    toggleOpen() {
      this.open = !this.open;
    },
    closeDropdown() {
      this.open = false;
    },
    handleOutsideClick(event) {
      const root = this.$refs.picker?.$el ?? this.$refs.picker;
      if (!root?.contains(event.target)) {
        this.closeDropdown();
      }
    },
    async selectSystemDefault() {
      this.closeDropdown();
      await this.filterPresetsPage?.setDefaultFilterPreset?.(null);
      await this.filterPresetsPage?.applySchemaDefaults?.();
    },
    async selectPreset(preset) {
      if (!preset) {
        return;
      }
      this.closeDropdown();
      await this.filterPresetsPage?.setDefaultFilterPreset?.(preset.id);
      await this.filterPresetsPage?.applyFilterPreset?.(preset);
    },
    openCreatePreset() {
      if (!this.filterPresetsPage) {
        return;
      }
      this.filterPresetsPage.filterPresetSaveName = '';
      this.filterPresetsPage.resetFilterPresetSaveAppearance?.();
      this.filterPresetsPage.filterPresetSaveDialogVisible = true;
    },
    openEdit(preset) {
      if (!preset) {
        return;
      }
      const appearance = this.presetAppearance(preset);
      this.closeDropdown();
      this.editPresetId = preset.id;
      this.editName = preset.name;
      this.editIcon = appearance.icon;
      this.editColor = appearance.color;
      this.editDialogVisible = true;
    },
    closeEditDialog() {
      this.editDialogVisible = false;
      this.editPresetId = null;
      this.editName = '';
      this.editIcon = '';
      this.editColor = '';
    },
    async handleEditSave() {
      if (!this.editPresetId || !this.editName.trim() || !this.editIcon || !this.editColor) {
        return;
      }
      this.editSaving = true;
      await this.filterPresetsPage?.updateFilterPresetAppearance?.(this.editPresetId, {
        name: this.editName,
        icon: this.editIcon,
        color: this.editColor,
      });
      this.editSaving = false;
      this.closeEditDialog();
    },
    openDeleteConfirm(preset) {
      if (!preset?.id) {
        return;
      }
      this.closeDropdown();
      this.deletePresetId = preset.id;
      this.deleteDialogVisible = true;
    },
    closeDeleteDialog() {
      this.deleteDialogVisible = false;
      this.deletePresetId = null;
    },
    handleDeleteConfirm() {
      const id = this.deletePresetId;
      this.closeDeleteDialog();
      if (id) {
        this.filterPresetsPage?.deleteFilterPreset?.(id);
      }
    },
  },
};
</script>
