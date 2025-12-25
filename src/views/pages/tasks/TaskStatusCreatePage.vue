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
            (editingItemId == null && !$store.getters.hasPermission('task_statuses_create'))">
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

export default {
    mixins: [getApiErrorMessage, formChangesMixin],
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
            editingItemId: this.editingItem ? this.editingItem.id : null,
            saveLoading: false,
            deleteDialog: false,
            deleteLoading: false
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
        async save() {
            this.saveLoading = true;
            try {
                let resp;
                if (this.editingItemId != null) {
                    resp = await TaskStatusController.updateItem(this.editingItemId, {
                        name: this.name,
                        color: this.color
                    });
                } else {
                    resp = await TaskStatusController.storeItem({
                        name: this.name,
                        color: this.color
                    });
                }
                if (resp.message) {
                    this.$emit('saved');
                    this.clearForm();
                }
            } catch (error) {
                this.$emit('saved-error', this.getApiErrorMessage(error));
            }
            this.saveLoading = false;
        },
        async deleteItem() {
            this.closeDeleteDialog();
            if (!this.editingItemId) return;
            this.deleteLoading = true;
            try {
                const resp = await TaskStatusController.deleteItem(this.editingItemId);
                if (resp.message) {
                    this.$emit('deleted');
                    this.clearForm();
                }
            } catch (error) {
                this.$emit('deleted-error', this.getApiErrorMessage(error));
            }
            this.deleteLoading = false;
        },
        clearForm() {
            this.id = null;
            this.name = '';
            this.color = '#6c757d';
            this.editingItemId = null;
            this.resetFormChanges();
        },
        showDeleteDialog() { this.deleteDialog = true; },
        closeDeleteDialog() { this.deleteDialog = false; }
    },
    watch: {
        editingItem: {
            handler(newEditingItem) {
                if (newEditingItem) {
                    this.id = newEditingItem.id || null;
                    this.name = newEditingItem.name || '';
                    this.color = newEditingItem.color || '#6c757d';
                    this.editingItemId = newEditingItem.id || null;
                } else {
                    this.id = null;
                    this.name = '';
                    this.color = '#6c757d';
                    this.editingItemId = null;
                }
            },
            deep: true,
            immediate: true
        }
    }
}
</script>

