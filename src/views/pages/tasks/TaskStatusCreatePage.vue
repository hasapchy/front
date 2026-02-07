<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">{{ editingItem ? $t('editTaskStatus') : $t('createTaskStatus') }}</h2>
        <div>
            <label class="required">{{ $t('statusName') }}</label>
            <input type="text" v-model="name" :disabled="allowEditStatus(id)">
        </div>
        <div class="mt-4">
            <label>{{ $t('statusColor') }}</label>
            <div class="flex items-center space-x-2">
                <input type="color" v-model="color" class="w-12 h-8 border rounded">
                <input type="text" v-model="color" class="flex-1" placeholder="#6c757d">
            </div>
        </div>
    </div>
    <div class="mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
        <PrimaryButton v-if="editingItem != null" :onclick="showDeleteDialog" :is-danger="true"
            :is-loading="deleteLoading" icon="fas fa-times"
            :disabled="!$store.getters.hasPermission('task_statuses_delete')">
        </PrimaryButton>
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading" :disabled="(editingItemId != null && !$store.getters.hasPermission('task_statuses_update')) ||
            (editingItemId == null && !$store.getters.hasPermission('task_statuses_create'))" :aria-label="$t('save')">
        </PrimaryButton>
    </div>
    <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog"
        :descr="$t('deleteTaskStatus')" :confirm-text="$t('deleteTaskStatus')" :leave-text="$t('cancel')" />
    <AlertDialog :dialog="closeConfirmDialog" @confirm="confirmClose" @leave="cancelClose"
        :descr="$t('unsavedChanges')" :confirm-text="$t('closeWithoutSaving')" :leave-text="$t('stay')" />
</template>

<script>
import TaskStatusController from '@/api/TaskStatusController';
import TaskStatusDto from '@/dto/task/TaskStatusDto';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import formChangesMixin from "@/mixins/formChangesMixin";
import crudFormMixin from "@/mixins/crudFormMixin";

export default {
    mixins: [getApiErrorMessage, formChangesMixin, crudFormMixin],
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', "close-request"],
    components: { PrimaryButton, AlertDialog },
    props: {
        editingItem: { type: TaskStatusDto, required: false, default: null }
    },
    data() {
        return {
            id: this.editingItem ? this.editingItem.id : null,
            name: this.editingItem ? this.editingItem.name : '',
            color: this.editingItem ? this.editingItem.color : '#6c757d',
        }
    },
    mounted() {
        this.$nextTick(async () => {
            this.saveInitialState();
        });
    },
    methods: {
        allowEditStatus(id){
            return this.ArrayItem(id);
        },
        ArrayItem(id) {
            return [1,2,3,4,5].includes(id);
        },
        getFormState() {
            return {
                id: this.id,
                name: this.name,
                color: this.color
            };
        },
        prepareSave() {
            return {
                name: this.name,
                color: this.color
            };
        },
        async performSave(data) {
            if (this.editingItemId != null) {
                return await TaskStatusController.updateItem(this.editingItemId, data);
            } else {
                return await TaskStatusController.storeItem(data);
            }
        },
        async performDelete() {
            const resp = await TaskStatusController.deleteItem(this.editingItemId);
            if (!resp.message) {
                throw new Error('Failed to delete task status');
            }
            return resp;
        },
        onSaveSuccess(response) {
            if (response && response.message) {
                this.clearForm();
            }
        },
        clearForm() {
            this.id = null;
            this.name = '';
            this.color = '#6c757d';
            if (this.resetFormChanges) {
                this.resetFormChanges();
            }
        },
        onEditingItemChanged(newEditingItem) {
            this.id = newEditingItem.id || null;
            this.name = newEditingItem.name || '';
            this.color = newEditingItem.color || '#6c757d';
        }
    }
}
</script>

