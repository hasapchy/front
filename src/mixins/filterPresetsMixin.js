import UserFilterPresetsController from '@/api/UserFilterPresetsController';
import { pickFilterPresetValues, normalizeFilterPresetValues, areFilterPresetValuesEqual } from '@/utils/filterPresetUtils';
import { resolveFilterPresetAppearance } from '@/utils/filterPresetAppearanceUtils';
import { FILTER_PRESETS_INJECT_KEY } from '@/constants/filterPresetSources';

export default {
  data() {
    return {
      filterPresets: [],
      filterPresetSchema: null,
      defaultFilterPresetId: null,
      filterPresetSaveDialogVisible: false,
      filterPresetSaveName: '',
      filterPresetSaveIcon: '',
      filterPresetSaveColor: '',
      filterPresetSaving: false,
      filterPresetLoadRequestId: 0,
      _applyingFilterPreset: false,
      _filterPresetsInitPromise: null,
      _filterPresetsTriggeredListFetch: false,
    };
  },

  provide() {
    return {
      [FILTER_PRESETS_INJECT_KEY]: this,
    };
  },

  computed: {
    filterPresetCurrentCompanyId() {
      return this.$store.getters.currentCompanyId;
    },
    activeFilterPreset() {
      if (!this.defaultFilterPresetId) {
        return null;
      }
      return this.filterPresets.find((item) => item.id === this.defaultFilterPresetId) ?? null;
    },
    hasCustomFilterPreset() {
      return this.defaultFilterPresetId != null;
    },
    activeFilterPresetName() {
      return this.activeFilterPreset?.name ?? '';
    },
    activeFilterPresetAppearance() {
      return resolveFilterPresetAppearance(this.activeFilterPreset);
    },
    filterPresetAppearanceIcons() {
      return this.filterPresetSchema?.appearance?.icons ?? [];
    },
    filterPresetAppearanceColors() {
      return this.filterPresetSchema?.appearance?.colors ?? [];
    },
    activeFilterPresetValuesChanged() {
      if (!this.activeFilterPreset || !this.filterPresetSchema?.keys) {
        return false;
      }
      const current = this.getFilterPresetValues();
      const saved = this.activeFilterPreset.filters || {};
      return !areFilterPresetValuesEqual(current, saved, this.filterPresetSchema.keys);
    },
  },

  watch: {
    filterPresetCurrentCompanyId: {
      handler(newId, oldId) {
        if (newId && newId !== oldId) {
          this.onFilterPresetCompanyChanged();
        }
      },
      immediate: false,
    },
  },

  mounted() {
    this._filterPresetsInitPromise = this.initializePageFilters();
  },

  methods: {
    getFilterPresetValues() {
      const keys = this.filterPresetSchema?.keys || [];
      return pickFilterPresetValues(this, keys);
    },

    buildEffectiveSchemaDefaults() {
      if (!this.filterPresetSchema?.defaults) {
        return null;
      }
      const merged = { ...this.filterPresetSchema.defaults };
      if (this.displayViewMode === 'kanban' && Array.isArray(this.filterPresetSchema.ignoredKeysInKanban)) {
        this.filterPresetSchema.ignoredKeysInKanban.forEach((key) => {
          delete merged[key];
        });
      }
      return merged;
    },

    resetToSchemaDefaults(done) {
      const values = this.buildEffectiveSchemaDefaults();
      if (!values) {
        return false;
      }
      this.resetFiltersFromConfig(values, done || (() => {}));
      return true;
    },

    async resetFiltersToSystemDefaults(done) {
      if (this.filterPresetSource) {
        await this.setDefaultFilterPreset(null);
      }
      const values = this.buildEffectiveSchemaDefaults();
      if (!values) {
        return false;
      }
      this._applyingFilterPreset = true;
      this.resetFiltersFromConfig(values, () => {});
      this._applyingFilterPreset = false;
      if (typeof done === 'function') {
        await Promise.resolve(done());
      } else if (this.refetchList) {
        await this.refetchList(1);
      }
      return true;
    },

    async waitForFilterPresetsInitialization() {
      if (!this.filterPresetSource) {
        return;
      }
      await (this._filterPresetsInitPromise ?? this.initializePageFilters());
    },

    async initializePageFilters() {
      if (!this.filterPresetSource) {
        return;
      }
      await this.fetchFilterPresetsFromApi();
      await this.tryApplyInitialFilters();
    },

    async fetchFilterPresetsFromApi() {
      if (!this.filterPresetSource) {
        return;
      }
      const requestId = ++this.filterPresetLoadRequestId;
      const companyId = this.filterPresetCurrentCompanyId;
      try {
        const data = await UserFilterPresetsController.list(this.filterPresetSource);
        if (requestId !== this.filterPresetLoadRequestId || companyId !== this.filterPresetCurrentCompanyId) {
          return;
        }
        this.filterPresets = data?.items || [];
        this.filterPresetSchema = data?.schema || null;
        this.defaultFilterPresetId = data?.defaultPresetId ?? null;
      } catch {
        if (requestId !== this.filterPresetLoadRequestId) {
          return;
        }
        this.filterPresets = [];
        this.filterPresetSchema = null;
        this.defaultFilterPresetId = null;
      }
    },

    async loadFilterPresets({ reapplyFilters = false } = {}) {
      await this.fetchFilterPresetsFromApi();
      if (reapplyFilters) {
        await this.tryApplyInitialFilters();
      }
    },

    onFilterPresetCompanyChanged() {
      this.defaultFilterPresetId = null;
      this._filterPresetsTriggeredListFetch = false;
      this._filterPresetsInitPromise = this.initializePageFilters();
    },

    async setDefaultFilterPreset(presetId) {
      if (!this.filterPresetSource) {
        return;
      }
      try {
        const data = await UserFilterPresetsController.setDefault(this.filterPresetSource, presetId);
        this.defaultFilterPresetId = data?.defaultPresetId ?? null;
      } catch (error) {
        const message = this.getApiErrorMessage?.(error) || error?.message || this.$t('error');
        this.showNotification?.(this.$t('error'), message, true);
      }
    },

    async tryApplyInitialFilters() {
      if (!this.filterPresetSchema || this._applyingFilterPreset) {
        return;
      }
      if (this.defaultFilterPresetId) {
        const preset = this.filterPresets.find((item) => item.id === this.defaultFilterPresetId);
        if (preset) {
          await this.applyFilterPreset(preset);
          return;
        }
      }
      await this.applySchemaDefaults();
    },

    async applySchemaDefaults() {
      const defaults = this.buildEffectiveSchemaDefaults();
      if (!defaults) {
        return;
      }
      this._applyingFilterPreset = true;
      this.resetFiltersFromConfig(defaults, () => {});
      await this.refetchList(1);
      this._filterPresetsTriggeredListFetch = true;
      this._applyingFilterPreset = false;
    },

    async applyFilterPreset(preset) {
      if (!preset || !this.filterPresetSchema) {
        return;
      }
      this._applyingFilterPreset = true;
      const normalized = normalizeFilterPresetValues(preset.filters, this.filterPresetSchema.keys);
      let merged = {
        ...this.filterPresetSchema.defaults,
        ...normalized,
      };
      if (this.displayViewMode === 'kanban' && Array.isArray(this.filterPresetSchema.ignoredKeysInKanban)) {
        const ignored = this.filterPresetSchema.ignoredKeysInKanban;
        if (ignored.some((key) => normalized[key] !== undefined && normalized[key] !== '' && normalized[key] !== null && normalized[key] !== false)) {
          this.showNotification?.(this.$t('filterPresets'), this.$t('filterPresetStatusIgnoredInKanban'), false);
        }
        ignored.forEach((key) => {
          delete merged[key];
        });
      }
      this.resetFiltersFromConfig(merged, () => {});
      await this.refetchList(1);
      this._filterPresetsTriggeredListFetch = true;
      this._applyingFilterPreset = false;
    },

    resetFilterPresetSaveAppearance() {
      this.filterPresetSaveIcon = '';
      this.filterPresetSaveColor = '';
    },

    async saveFilterPreset(name, icon, color) {
      const trimmed = (name || '').trim();
      if (!trimmed || !icon || !color || !this.filterPresetSource) {
        return;
      }
      this.filterPresetSaving = true;
      try {
        const created = await UserFilterPresetsController.create({
          source: this.filterPresetSource,
          name: trimmed,
          icon,
          color,
          filters: this.getFilterPresetValues(),
        });
        await this.loadFilterPresets();
        if (created?.id) {
          await this.setDefaultFilterPreset(created.id);
        }
        this.filterPresetSaveDialogVisible = false;
        this.filterPresetSaveName = '';
        this.resetFilterPresetSaveAppearance();
        this.showNotification?.(this.$t('filterPresets'), this.$t('filterPresetSaved'), false);
      } catch (error) {
        const message = this.getApiErrorMessage?.(error) || error?.message || this.$t('error');
        this.showNotification?.(this.$t('error'), message, true);
      }
      this.filterPresetSaving = false;
    },

    async updateFilterPresetAppearance(id, payload) {
      const name = (payload?.name || '').trim();
      const icon = payload?.icon;
      const color = payload?.color;
      if (!name || !icon || !color || !id) {
        return;
      }
      try {
        await UserFilterPresetsController.update(id, { name, icon, color });
        await this.loadFilterPresets();
        this.showNotification?.(this.$t('filterPresets'), this.$t('filterPresetUpdated'), false);
      } catch (error) {
        const message = this.getApiErrorMessage?.(error) || error?.message || this.$t('error');
        this.showNotification?.(this.$t('error'), message, true);
      }
    },

    async revertActiveFilterPreset() {
      const preset = this.activeFilterPreset;
      if (!preset || !this.filterPresetSchema) {
        return;
      }
      this._applyingFilterPreset = true;
      const normalized = normalizeFilterPresetValues(preset.filters, this.filterPresetSchema?.keys || []);
      let merged = {
        ...this.filterPresetSchema.defaults,
        ...normalized,
      };
      if (this.displayViewMode === 'kanban' && Array.isArray(this.filterPresetSchema.ignoredKeysInKanban)) {
        this.filterPresetSchema.ignoredKeysInKanban.forEach((key) => {
          delete merged[key];
        });
      }
      this.resetFiltersFromConfig(merged, () => {});
      this._applyingFilterPreset = false;
    },

    async updateActiveFilterPresetFilters() {
      const preset = this.activeFilterPreset;
      if (!preset?.id || !this.filterPresetSource) {
        return;
      }
      try {
        await UserFilterPresetsController.update(preset.id, {
          filters: this.getFilterPresetValues(),
        });
        await this.loadFilterPresets();
        this.showNotification?.(this.$t('filterPresets'), this.$t('filterPresetUpdated'), false);
      } catch (error) {
        const message = this.getApiErrorMessage?.(error) || error?.message || this.$t('error');
        this.showNotification?.(this.$t('error'), message, true);
      }
    },

    async deleteFilterPreset(id) {
      if (!id) {
        return;
      }
      const wasDefault = this.defaultFilterPresetId === id;
      try {
        await UserFilterPresetsController.delete(id);
        await this.loadFilterPresets({ reapplyFilters: wasDefault });
        this.showNotification?.(this.$t('filterPresets'), this.$t('filterPresetDeleted'), false);
      } catch (error) {
        const message = this.apiErrorLinesAsString?.(error) || error?.message || this.$t('error');
        this.showNotification?.(this.$t('error'), message, true);
      }
    },
  },
};
