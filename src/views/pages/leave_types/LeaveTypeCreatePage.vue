<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="min-h-0 flex-1 overflow-auto p-4">
    <div class="mb-4">
      <label class="required">{{ $t('name') }}</label>
      <input
        v-model="name"
        type="text"
      >
    </div>
    <div>
      <label>{{ $t('color') }}</label>
      <div class="flex items-center gap-2">
        <input
          v-model="color"
          type="color"
          class="w-16 h-10 rounded border border-gray-300 cursor-pointer"
        >
        <input
          v-model="color"
          type="text"
          placeholder="#3B82F6"
          maxlength="7" 
          class="flex-1"
          pattern="^#[0-9A-Fa-f]{6}$"
        >
      </div>
    </div>
    <div class="mb-4 flex items-center gap-2">
      <input
        id="is_penalty"
        v-model="isPenalty"
        type="checkbox"
        class="rounded border-gray-300"
      >
      <label for="is_penalty">{{ $t('leaveTypeIsPenaltyDays') }}</label>
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
          :disabled="!$store.getters.hasPermission('leave_types_delete_all')"
          :aria-label="$t('delete')"
        />
        <PrimaryButton
          icon="fas fa-save"
          :onclick="save"
          :is-loading="saveLoading"
          :aria-label="$t('save')"
          :disabled="!name || name.trim() === '' ||
            (editingItemId != null && !$store.getters.hasPermission('leave_types_update_all')) ||
            (editingItemId == null && !$store.getters.hasPermission('leave_types_create'))"
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
import LeaveTypeController from '@/api/LeaveTypeController';
import LeaveTypeDto from '@/dto/leave/LeaveTypeDto';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import crudFormMixin from "@/mixins/crudFormMixin";
import { sideModalFooterPortal } from '@/views/components/app/dialog/SideModalDialog.vue';

import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';

export default {
    components: { PrimaryButton, AlertDialog },
    mixins: [getApiErrorMessage, crudFormMixin, sideModalFooterPortal],
    props: {
        editingItem: { type: LeaveTypeDto, required: false, default: null }
    },
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', "close-request"],
    data() {
        return {
            name: this.editingItem ? this.editingItem.name : '',
            color: this.editingItem && this.editingItem.color ? this.editingItem.color : '#3B82F6',
            isPenalty: this.editingItem ? Number(this.editingItem.isPenalty) === 1 : false,
        }
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
                isPenalty: this.isPenalty
            };
        },
        prepareSave() {
            return {
                name: this.name.trim(),
                color: this.color && this.color.trim() ? this.color.trim() : null,
                isPenalty: this.isPenalty
            };
        },
        async performSave(data) {
            if (this.editingItemId != null) {
                return await LeaveTypeController.updateItem(this.editingItemId, data);
            } else {
                return await LeaveTypeController.storeItem(data);
            }
        },
        async performDelete() {
            const resp = await LeaveTypeController.deleteItem(this.editingItemId);
            if (!resp.message) {
                throw new Error('Failed to delete leave type');
            }
            return resp;
        },
        onSaveSuccess(response) {
            if (response && response.message) {
                this.clearForm();
            }
        },
        clearForm() {
            this.name = '';
            this.color = '#3B82F6';
            this.isPenalty = false;
            if (this.resetFormChanges) {
                this.resetFormChanges();
            }
        },
        onEditingItemChanged(newEditingItem) {
            this.name = newEditingItem.name ;
            this.color = newEditingItem.color || '#3B82F6';
            this.isPenalty = Number(newEditingItem.isPenalty) === 1;
        }
    }
}
</script>

