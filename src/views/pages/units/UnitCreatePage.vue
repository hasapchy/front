<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="min-h-0 flex-1 overflow-auto p-4">
      <div class="mt-2 space-y-4">
        <div>
          <label class="required">{{ $t('name') }}</label>
          <input v-model="name" type="text" :disabled="!canEdit">
        </div>
        <div>
          <label class="required">{{ $t('unitDesignation') }}</label>
          <input v-model="shortName" type="text" :disabled="!canEdit">
        </div>
      </div>
    </div>
    <teleport v-bind="sideModalFooterTeleportBind">
      <div class="flex w-full flex-wrap items-center gap-2">
        <PrimaryButton v-if="editingItem != null && canDelete" :onclick="showDeleteDialog" :is-danger="true"
          :is-loading="deleteLoading" icon="fas fa-trash" />
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
import UnitsController from '@/api/UnitsController';
import UnitCatalogDto from '@/dto/settings/UnitCatalogDto';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import crudFormMixin from '@/mixins/crudFormMixin';
import { sideModalFooterPortal } from '@/views/components/app/dialog/SideModalDialog.vue';

export default {
  components: { PrimaryButton, AlertDialog },
  mixins: [getApiErrorMessage, crudFormMixin, sideModalFooterPortal],
  props: {
    editingItem: { type: UnitCatalogDto, required: false, default: null },
  },
  emits: ['saved', 'saved-error', 'deleted', 'deleted-error', 'close-request'],
  data() {
    return {
      name: this.editingItem ? this.editingItem.name : '',
      shortName: this.editingItem ? this.editingItem.shortName : '',
    };
  },
  computed: {
    canEdit() {
      if (this.editingItemId != null) {
        return this.$store.getters.hasPermission('units_update');
      }
      return this.$store.getters.hasPermission('units_create');
    },
    canDelete() {
      return this.editingItemId != null && this.$store.getters.hasPermission('units_delete');
    },
    canSave() {
      if (!this.canEdit) {
        return false;
      }
      if (!this.name.trim() || !this.shortName.trim()) {
        return false;
      }
      return true;
    },
  },
  mounted() {
    this.$nextTick(() => {
      this.saveInitialState();
    });
  },
  methods: {
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
        return await UnitsController.updateUnit(this.editingItemId, data);
      }
      return await UnitsController.createUnit(data);
    },
    async performDelete() {
      await UnitsController.deleteUnit(this.editingItemId);
      return { message: 'ok' };
    },
    onSaveSuccess() {
    },
    clearForm() {
      this.name = '';
      this.shortName = '';
      if (this.resetFormChanges) {
        this.resetFormChanges();
      }
    },
    onEditingItemChanged(newEditingItem) {
      if (!newEditingItem) {
        this.name = '';
        this.shortName = '';
        return;
      }
      this.name = newEditingItem.name;
      this.shortName = newEditingItem.shortName;
    },
  },
};
</script>
