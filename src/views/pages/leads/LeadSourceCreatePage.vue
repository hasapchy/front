<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="min-h-0 flex-1 overflow-auto p-4">
      <div>
        <label class="required">{{ $t('name') }}</label>
        <input
          v-model="name"
          type="text"
        >
      </div>
    </div>
    <teleport v-bind="sideModalFooterTeleportBind">
      <div class="flex w-full flex-wrap items-center gap-2">
        <PrimaryButton
          v-if="editingItem != null"
          :onclick="showDeleteDialog"
          :is-danger="true"
          :is-loading="deleteLoading"
          icon="fas fa-trash"
          :disabled="!canDeleteLeadSource"
          :aria-label="$t('delete')"
        />
        <PrimaryButton
          icon="fas fa-save"
          :onclick="save"
          :is-loading="saveLoading"
          :disabled="!name || name.trim() === '' || !canSaveLeadSource"
          :aria-label="$t('save')"
        />
      </div>
    </teleport>
  </div>
  <AlertDialog
    :dialog="deleteDialog"
    :descr="$t('confirmDelete')"
    :confirm-text="$t('delete')"
    :leave-text="$t('cancel')"
    @confirm="deleteItem"
    @leave="closeDeleteDialog"
  />
  <AlertDialog
    :dialog="closeConfirmDialog"
    :descr="$t('unsavedChanges')"
    :confirm-text="$t('closeWithoutSaving')"
    :leave-text="$t('stay')"
    @confirm="confirmClose"
    @leave="cancelClose"
  />
</template>

<script>
import LeadSourceController from '@/api/LeadSourceController';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import crudFormMixin from '@/mixins/crudFormMixin';
import { sideModalFooterPortal } from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';

export default {
  components: { PrimaryButton, AlertDialog },
  mixins: [getApiErrorMessage, crudFormMixin, sideModalFooterPortal],
  props: {
    editingItem: { type: Object, default: null },
  },
  emits: ['saved', 'saved-error', 'deleted', 'deleted-error', 'close-request'],
  data() {
    return {
      name: this.editingItem?.name ?? '',
    };
  },
  computed: {
    canSaveLeadSource() {
      if (this.editingItemId != null) {
        return (
          this.$store.getters.hasPermission('lead_sources_update_all') ||
          this.$store.getters.hasPermission('lead_sources_update')
        );
      }
      return this.$store.getters.hasPermission('lead_sources_create');
    },
    canDeleteLeadSource() {
      return (
        this.$store.getters.hasPermission('lead_sources_delete_all') ||
        this.$store.getters.hasPermission('lead_sources_delete')
      );
    },
  },
  mounted() {
    this.$nextTick(() => {
      this.saveInitialState();
    });
  },
  methods: {
    getFormState() {
      return { name: this.name };
    },
    prepareSave() {
      return { name: this.name.trim() };
    },
    async performSave(data) {
      if (this.editingItemId != null) {
        return LeadSourceController.updateItem(this.editingItemId, data);
      }
      return LeadSourceController.storeItem(data);
    },
    async performDelete() {
      return LeadSourceController.deleteItem(this.editingItemId);
    },
    onEditingItemChanged(newEditingItem) {
      this.name = newEditingItem?.name ?? '';
    },
    clearForm() {
      this.name = '';
      if (this.resetFormChanges) {
        this.resetFormChanges();
      }
    },
  },
};
</script>
