<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="min-h-0 flex-1 overflow-auto p-4">
      <TabBar :key="`unit-tabs-${$i18n.locale}`" :tabs="visibleTabs" :active-tab="currentTab" :tab-click="changeTab" />
      <div v-show="currentTab === 'info'">
        <div class="mt-2 space-y-4">
          <p v-if="isReadOnly" class="text-sm text-gray-600 dark:text-[var(--text-secondary)]">
            {{ $t('unitSystemReadonlyHint') }}
          </p>
          <div>
            <label class="required">{{ $t('name') }}</label>
            <input v-model="name" type="text" :disabled="isReadOnly">
          </div>
          <div>
            <label class="required">{{ $t('shortName') }}</label>
            <input v-model="shortName" type="text" :disabled="isReadOnly">
          </div>
        </div>
      </div>
      <div v-show="currentTab === 'packaging'" class="mt-4">
        <UnitPackagingTab :key="packagingTabKey" :unit-id="packagingUnitId" :read-only="isReadOnly"
          :unit-options="packagingUnitOptions" @changed="$emit('packaging-changed')" />
      </div>
    </div>
    <teleport v-bind="sideModalFooterTeleportBind">
      <div class="flex w-full flex-wrap items-center gap-2">
        <PrimaryButton v-if="editingItem != null && !isReadOnly" :onclick="showDeleteDialog" :is-danger="true"
          :is-loading="deleteLoading" icon="fas fa-trash"
          :disabled="!$store.getters.hasPermission('settings_units_manage')" />
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading" :disabled="!canSave"
          :aria-label="$t('save')" />
      </div>
    </teleport>
  </div>
  <AlertDialog :dialog="deleteDialog" :descr="$t('deleteUnitCatalogItem')" :confirm-text="$t('deleteUnitCatalogItem')"
    :leave-text="$t('cancel')" @confirm="deleteItem" @leave="closeDeleteDialog" />
  <AlertDialog :dialog="closeConfirmDialog" :descr="$t('unsavedChanges')" :confirm-text="$t('closeWithoutSaving')"
    :leave-text="$t('stay')" @confirm="confirmClose" @leave="cancelClose" />
</template>

<script>
import SettingsUnitsController from '@/api/SettingsUnitsController';
import UnitCatalogDto from '@/dto/settings/UnitCatalogDto';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import TabBar from '@/views/components/app/forms/TabBar.vue';
import UnitPackagingTab from './UnitPackagingTab.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import crudFormMixin from '@/mixins/crudFormMixin';
import { sideModalFooterPortal } from '@/views/components/app/dialog/SideModalDialog.vue';

export default {
  components: { PrimaryButton, AlertDialog, TabBar, UnitPackagingTab },
  mixins: [getApiErrorMessage, crudFormMixin, sideModalFooterPortal],
  props: {
    editingItem: { type: UnitCatalogDto, required: false, default: null },
    packagingUnitOptions: { type: Array, default: () => [] },
  },
  emits: ['saved', 'saved-error', 'deleted', 'deleted-error', 'close-request', 'packaging-changed'],
  data() {
    return {
      name: this.editingItem ? this.editingItem.name : '',
      shortName: this.editingItem ? this.editingItem.shortName : '',
      currentTab: 'info',
      tabs: [
        { name: 'info', labelKey: 'unitTabMain' },
        { name: 'packaging', labelKey: 'unitConversions' },
      ],
    };
  },
  computed: {
    packagingTabKey() {
      return this.editingItemId || 0;
    },
    packagingUnitId() {
      const id = this.editingItemId;
      if (id == null || id === '') {
        return null;
      }
      const n = Number(id);
      return Number.isFinite(n) ? n : null;
    },
    visibleTabs() {
      const list = this.editingItemId != null
        ? this.tabs
        : this.tabs.filter((t) => t.name === 'info');
      return list.map((t) => ({
        ...t,
        label: this.$t(t.labelKey),
      }));
    },
    isReadOnly() {
      return this.editingItem != null && this.editingItem.isSystem === true;
    },
    canSave() {
      if (!this.$store.getters.hasPermission('settings_units_manage')) {
        return false;
      }
      if (this.isReadOnly) {
        return false;
      }
      if (!this.name.trim() || !this.shortName.trim()) {
        return false;
      }
      return true;
    },
  },
  watch: {
    editingItemId() {
      if (this.editingItemId == null) {
        this.currentTab = 'info';
      }
    },
  },
  mounted() {
    this.$nextTick(() => {
      this.saveInitialState();
    });
  },
  methods: {
    changeTab(tab) {
      if (tab === 'packaging' && this.editingItemId == null) {
        return;
      }
      this.currentTab = tab;
    },
    getFormState() {
      return {
        name: this.name,
        shortName: this.shortName,
      };
    },
    prepareSave() {
      return {
        name: this.name.trim(),
        shortName: this.shortName.trim(),
      };
    },
    async performSave(data) {
      if (this.editingItemId != null) {
        return await SettingsUnitsController.updateUnit(this.editingItemId, data);
      }
      return await SettingsUnitsController.createUnit(data);
    },
    async performDelete() {
      await SettingsUnitsController.deleteUnit(this.editingItemId);
      return { message: 'ok' };
    },
    onSaveSuccess() {
    },
    clearForm() {
      this.name = '';
      this.shortName = '';
      this.currentTab = 'info';
      if (this.resetFormChanges) {
        this.resetFormChanges();
      }
    },
    onEditingItemChanged(newEditingItem) {
      if (!newEditingItem) {
        this.name = '';
        this.shortName = '';
        this.currentTab = 'info';
        return;
      }
      this.name = newEditingItem.name;
      this.shortName = newEditingItem.shortName;
    },
  },
};
</script>
