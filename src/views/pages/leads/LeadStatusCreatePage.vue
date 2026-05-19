<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="min-h-0 flex-1 overflow-auto p-4">
      <div>
        <label class="required">{{ $t('statusName') }}</label>
        <input
          v-model="name"
          type="text"
        >
      </div>
      <div class="mt-4">
        <label>{{ $t('color') }}</label>
        <div class="flex items-center gap-2">
          <input
            v-model="color"
            type="color"
            class="h-10 w-16 cursor-pointer rounded border border-gray-300"
          >
          <input
            v-model="color"
            type="text"
            maxlength="16"
            class="flex-1"
          >
        </div>
      </div>
      <div class="mt-4">
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm text-gray-900 dark:text-[var(--text-primary)]">{{ $t('isActive') }}</span>
          <ToggleSwitch
            v-model="isActive"
            :aria-label="$t('isActive')"
          />
        </div>
      </div>
      <div class="mt-4">
        <label>{{ $t('sort') }}</label>
        <input
          v-model.number="sort"
          type="number"
          min="0"
          class="w-full border rounded p-2"
        >
      </div>
      <div class="mt-4">
        <label>{{ $t('leadKanbanOutcome') }}</label>
        <select
          v-model="kanbanOutcome"
          class="w-full border rounded p-2"
        >
          <option value="">
            {{ $t('no') }}
          </option>
          <option value="success">
            {{ $t('leadKanbanOutcomeSuccess') }}
          </option>
          <option value="failure">
            {{ $t('leadKanbanOutcomeFailure') }}
          </option>
        </select>
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
          :disabled="!canDeleteLeadStatus"
          :aria-label="$t('delete')"
        />
        <PrimaryButton
          icon="fas fa-save"
          :onclick="save"
          :is-loading="saveLoading"
          :disabled="!name || name.trim() === '' || !canSaveLeadStatus"
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
import LeadStatusController from '@/api/LeadStatusController';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import crudFormMixin from '@/mixins/crudFormMixin';
import { sideModalFooterPortal } from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import ToggleSwitch from '@/views/components/app/forms/ToggleSwitch.vue';

export default {
  components: { PrimaryButton, AlertDialog, ToggleSwitch },
  mixins: [getApiErrorMessage, crudFormMixin, sideModalFooterPortal],
  props: {
    editingItem: { type: Object, default: null },
  },
  emits: ['saved', 'saved-error', 'deleted', 'deleted-error', 'close-request'],
  data() {
    return {
      name: this.editingItem?.name ?? '',
      color: this.editingItem?.color ?? '#6c757d',
      isActive: this.editingItem ? this.editingItem.isActive !== false : true,
      sort: this.editingItem?.sort ?? 0,
      kanbanOutcome: this.editingItem?.kanbanOutcome ?? '',
    };
  },
  computed: {
    canSaveLeadStatus() {
      if (this.editingItemId != null) {
        return (
          this.$store.getters.hasPermission('lead_statuses_update_all') ||
          this.$store.getters.hasPermission('lead_statuses_update')
        );
      }
      return this.$store.getters.hasPermission('lead_statuses_create');
    },
    canDeleteLeadStatus() {
      return (
        this.$store.getters.hasPermission('lead_statuses_delete_all') ||
        this.$store.getters.hasPermission('lead_statuses_delete')
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
      return {
        name: this.name,
        color: this.color,
        isActive: this.isActive,
        sort: this.sort,
        kanbanOutcome: this.kanbanOutcome,
      };
    },
    prepareSave() {
      return {
        name: this.name.trim(),
        color: this.color && String(this.color).trim() ? String(this.color).trim() : null,
        isActive: this.isActive,
        sort: Number.isFinite(Number(this.sort)) ? Number(this.sort) : 0,
        kanbanOutcome: this.kanbanOutcome === '' ? null : this.kanbanOutcome,
      };
    },
    async performSave(data) {
      if (this.editingItemId != null) {
        return LeadStatusController.updateItem(this.editingItemId, data);
      }
      return LeadStatusController.storeItem(data);
    },
    async performDelete() {
      return LeadStatusController.deleteItem(this.editingItemId);
    },
    onEditingItemChanged(newEditingItem) {
      if (!newEditingItem) {
        this.name = '';
        this.color = '#6c757d';
        this.isActive = true;
        this.sort = 0;
        this.kanbanOutcome = '';
        return;
      }
      this.name = newEditingItem.name ?? '';
      this.color = newEditingItem.color ?? '#6c757d';
      this.isActive = newEditingItem.isActive !== false;
      this.sort = newEditingItem.sort ?? 0;
      this.kanbanOutcome = newEditingItem.kanbanOutcome ?? '';
    },
    clearForm() {
      this.name = '';
      this.color = '#6c757d';
      this.isActive = true;
      this.sort = 0;
      this.kanbanOutcome = '';
      if (this.resetFormChanges) {
        this.resetFormChanges();
      }
    },
  },
};
</script>
