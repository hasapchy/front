<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">{{ editingItem ? $t('editProjectStatus') : $t('createProjectStatus') }}</h2>
        <div>
            <label class="required">{{ $t('statusName') }}</label>
            <input type="text" v-model="name">
        </div>
        <div class="mt-4">
            <label>{{ $t('statusColor') }}</label>
            <div class="flex items-center space-x-2">
                <input type="color" v-model="color" class="w-12 h-8 border rounded">
                <input type="text" v-model="color" class="flex-1" placeholder="#6c757d">
            </div>
        </div>
        <div class="mt-4">
            <label class="flex items-center space-x-2">
                <input type="checkbox" v-model="isTrVisible" class="w-4 h-4">
                <span>{{ $t('showInProjectSelect') }}</span>
            </label>
            <p class="text-sm text-gray-600 mt-2 ml-6">{{ $t('showInProjectSelectDescription') }}</p>
        </div>
    </div>
    <div class="mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
        <PrimaryButton v-if="editingItem != null" :onclick="showDeleteDialog" :is-danger="true"
            :is-loading="deleteLoading" icon="fas fa-times"
            :disabled="!$store.getters.hasPermission('project_statuses_delete')">
        </PrimaryButton>
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading" :disabled="(editingItemId != null && !$store.getters.hasPermission('project_statuses_update')) ||
            (editingItemId == null && !$store.getters.hasPermission('project_statuses_create'))" :aria-label="$t('save')">
        </PrimaryButton>
    </div>
    <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog"
        :descr="$t('deleteProjectStatus')" :confirm-text="$t('deleteProjectStatus')" :leave-text="$t('cancel')" />
    <AlertDialog :dialog="closeConfirmDialog" @confirm="confirmClose" @leave="cancelClose"
        :descr="$t('unsavedChanges')" :confirm-text="$t('closeWithoutSaving')" :leave-text="$t('stay')" />
</template>

<script>
import ProjectStatusController from '@/api/ProjectStatusController';
import ProjectStatusDto from '@/dto/project/ProjectStatusDto';
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
        editingItem: { type: ProjectStatusDto, required: false, default: null }
    },
    data() {
        return {
            name: this.editingItem ? this.editingItem.name : '',
            color: this.editingItem ? this.editingItem.color : '#6c757d',
            isTrVisible: this.editingItem?.isTrVisible ?? true,
        }
    },
    mounted() {
        this.$nextTick(async () => {
            this.saveInitialState();
        });
    },
    methods: {
        getFormState() {
            return {
                name: this.name,
                color: this.color,
                is_tr_visible: this.isTrVisible
            };
        },
        prepareSave() {
            return {
                name: this.name,
                color: this.color,
                is_tr_visible: this.isTrVisible
            };
        },
        async performSave(data) {
            if (this.editingItemId != null) {
                return await ProjectStatusController.updateItem(this.editingItemId, data);
            } else {
                return await ProjectStatusController.storeItem(data);
            }
        },
        async performDelete() {
            const resp = await ProjectStatusController.deleteItem(this.editingItemId);
            if (!resp.message) {
                throw new Error('Failed to delete project status');
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
            this.color = '#6c757d';
            this.isTrVisible = true;
            if (this.resetFormChanges) {
                this.resetFormChanges();
            }
        },
        onEditingItemChanged(newEditingItem) {
            this.name = newEditingItem.name || '';
            this.color = newEditingItem.color || '#6c757d';
            this.isTrVisible = newEditingItem.isTrVisible ?? true;
        }
    }
}
</script>
