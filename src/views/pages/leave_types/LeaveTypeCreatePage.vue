<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">{{ editingItem ? $t('editLeaveType') : $t('createLeaveType') }}</h2>
        <div class="mb-4">
            <label class="required">{{ $t('name') }}</label>
            <input type="text" v-model="name">
        </div>
        <div>
            <label>{{ $t('color') || 'Цвет' }}</label>
            <div class="flex items-center gap-2">
                <input type="color" v-model="color" class="w-16 h-10 rounded border border-gray-300 cursor-pointer">
                <input type="text" v-model="color" placeholder="#3B82F6" maxlength="7" 
                    class="flex-1" pattern="^#[0-9A-Fa-f]{6}$">
            </div>
        </div>
    </div>
    <div class="mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
        <PrimaryButton v-if="editingItem != null" :onclick="showDeleteDialog" :is-danger="true"
            :is-loading="deleteLoading" icon="fas fa-trash"
            :disabled="!$store.getters.hasPermission('leave_types_delete_all')">
        </PrimaryButton>
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading" 
            :disabled="!name || name.trim() === '' || 
            (editingItemId != null && !$store.getters.hasPermission('leave_types_update_all')) ||
            (editingItemId == null && !$store.getters.hasPermission('leave_types_create_all'))">
        </PrimaryButton>
    </div>
    <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog"
        :descr="$t('confirmDelete')" :confirm-text="$t('delete')" :leave-text="$t('cancel')" />
    <AlertDialog :dialog="closeConfirmDialog" @confirm="confirmClose" @leave="cancelClose"
        :descr="$t('unsavedChanges')" :confirm-text="$t('closeWithoutSaving')" :leave-text="$t('stay')" />
</template>

<script>
import LeaveTypeController from '@/api/LeaveTypeController';
import LeaveTypeDto from '@/dto/leave/LeaveTypeDto';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import formChangesMixin from "@/mixins/formChangesMixin";
import crudFormMixin from "@/mixins/crudFormMixin";

import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';

export default {
    mixins: [getApiErrorMessage, formChangesMixin, crudFormMixin],
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', "close-request"],
    components: { PrimaryButton, AlertDialog },
    props: {
        editingItem: { type: LeaveTypeDto, required: false, default: null }
    },
    data() {
        return {
            name: this.editingItem ? this.editingItem.name : '',
            color: this.editingItem && this.editingItem.color ? this.editingItem.color : '#3B82F6',
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
                color: this.color
            };
        },
        prepareSave() {
            return {
                name: this.name.trim(),
                color: this.color && this.color.trim() ? this.color.trim() : null
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
            if (this.resetFormChanges) {
                this.resetFormChanges();
            }
        },
        onEditingItemChanged(newEditingItem) {
            this.name = newEditingItem.name || '';
            this.color = newEditingItem.color || '#3B82F6';
        }
    }
}
</script>

