<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">{{ editingItem ? $t('editProject') : $t('createProject') }}</h2>
        <TabBar :tabs="translatedTabs" :active-tab="currentTab" :tab-click="(t) => { currentTab = t }" />
        <div v-show="currentTab === 'info'">
            <ClientSearch v-model:selectedClient="selectedClient" :disabled="!!editingItemId" />
            <div>
                <label class="required">{{ $t('name') }}</label>
                <input type="text" v-model="name">
            </div>
            <div>
                <label>{{ $t('projectDate') }}</label>
                <input type="datetime-local" v-model="date" :disabled="!!editingItemId">
            </div>
            <div>
                <label>{{ $t('projectBudget') }}</label>
                <input type="number" v-model="budget">
            </div>
            <div>
                <label class="required">{{ $t('assignUsers') }}</label>
                <div v-if="users != null && users.length != 0" class="flex flex-wrap gap-2">
                    <label v-for="user in users" :key="user.id"
                        class="flex items-center space-x-2 px-2 py-1 bg-gray-100 rounded">
                        <input type="checkbox" :value="user.id.toString()" v-model="selectedUsers"
                            :id="'user-' + user.id" />
                        <span class="text-black">{{ user.name }}</span>
                    </label>
                </div>
            </div>
        </div>
        <div v-show="currentTab === 'files'">
            <label>{{ $t('files') }}</label>
            <input type="file" multiple @change="handleFileChange" />
            <ul v-if="editingItem">
                <li v-for="file in editingItem.getFormattedFiles()" :key="file.path" class="flex items-center gap-2">
                    <i :class="file.icon"></i>
                    <a :href="file.url" target="_blank" download class="text-blue-600 hover:underline">{{ file.name
                    }}</a>
                    <button @click="showDeleteFileDialogByPath(file.path)" class="text-red-500">{{ $t('delete') }}</button>
                </li>
            </ul>
        </div>
        <div v-show="currentTab === 'balance'">
            <ProjectBalanceTab v-if="editingItem" :editing-item="editingItem" />
        </div>
    </div>
    <div class="mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
        <PrimaryButton v-if="editingItem != null" :onclick="showDeleteDialog" :is-danger="true"
            :is-loading="deleteLoading" icon="fas fa-remove"
            :disabled="!$store.getters.hasPermission('projects_delete')">
            {{ $t('delete') }}
        </PrimaryButton>
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading" :disabled="(editingItemId != null && !$store.getters.hasPermission('projects_update')) ||
            (editingItemId == null && !$store.getters.hasPermission('projects_create'))">
            {{ $t('save') }}
        </PrimaryButton>
    </div>
    <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog"
        :descr="$t('deleteProject')" :confirm-text="$t('deleteProject')" :leave-text="$t('cancel')" />
    <AlertDialog :dialog="closeConfirmDialog" @confirm="confirmClose" @leave="cancelClose"
        :descr="$t('unsavedChanges')" :confirm-text="$t('closeWithoutSaving')" :leave-text="$t('stay')" />
    <AlertDialog :dialog="deleteFileDialog" @confirm="confirmDeleteFile" @leave="closeDeleteFileDialog"
        :descr="`${$t('deleteFileConfirm')} '${editingItem?.files?.[deleteFileIndex]?.name || $t('deleteFileWithoutName')}'`"
                  :confirm-text="$t('deleteFile')" :leave-text="$t('cancel')" />
</template>

<script>
import UsersController from '@/api/UsersController';
import TabBar from '@/views/components/app/forms/TabBar.vue';
import ProjectDto from '@/dto/project/ProjectDto';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import ProjectController from '@/api/ProjectController';
import ClientSearch from '@/views/components/app/search/ClientSearch.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import formChangesMixin from "@/mixins/formChangesMixin";

import ProjectBalanceTab from '@/views/pages/projects/ProjectBalanceTab.vue';

export default {
    mixins: [getApiErrorMessage, formChangesMixin],
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', "close-request"],
    components: { PrimaryButton, AlertDialog, TabBar, ClientSearch, ProjectBalanceTab },
    props: {
        editingItem: { type: ProjectDto, required: false, default: null }
    },
    data() {
        return {
            name: this.editingItem ? this.editingItem.name : '',
            budget: this.editingItem ? this.editingItem.budget : 0,
            date: this.editingItem && this.editingItem.date
                ? new Date(this.editingItem.date).toISOString().substring(0, 16)
                : new Date().toISOString().substring(0, 16),
            selectedUsers: [],
            editingItemId: this.editingItem ? this.editingItem.id : null,
            selectedClient: this.editingItem ? this.editingItem.client : null,
            users: [],
            saveLoading: false,
            deleteDialog: false,
            deleteLoading: false,

            uploading: false,
            deleteFileDialog: false,
            deleteFileIndex: -1,
            currentTab: 'info',
            tabs: [
                { name: 'info', label: 'info' },
                { name: 'files', label: 'files' },
                { name: "balance", label: "balance" },
            ],
        }
    },
    computed: {
        translatedTabs() {
            return this.tabs.map(tab => ({
                ...tab,
                label: this.$t(tab.label)
            }));
        }
    },
    created() {
        this.fetchUsers()
    },
    mounted() {
        // Сохраняем начальное состояние после монтирования компонента
        this.$nextTick(() => {
            this.saveInitialState();
        });
    },
    methods: {
                // Переопределяем метод getFormState из миксина
        getFormState() {
            return {
                name: this.name,
                budget: this.budget,
                date: this.date,
                selectedClient: this.selectedClient?.id || null,
                selectedUsers: [...this.selectedUsers]
            };
        },
        async fetchUsers() {
            this.users = await UsersController.getAllUsers();

            if (this.editingItem && Array.isArray(this.editingItem.users)) {
                this.selectedUsers = this.editingItem.getUserIds();
            }
        },
        async save() {
            if (this.uploading) {
                alert(this.$t('waitForFileUpload'));
                return;
            }
            this.saveLoading = true;
            try {
                let resp;
                const formData = {
                    name: this.name,
                    budget: this.budget,
                    date: new Date(this.date).toISOString(),
                    client_id: this.selectedClient?.id,
                    users: this.selectedUsers,
                };

                if (this.editingItemId != null) {
                    resp = await ProjectController.updateItem(this.editingItemId, formData);
                } else {
                    resp = await ProjectController.storeItem(formData);
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
        },
        clearForm() {
            this.name = '';
            this.budget = 0;
            this.date = new Date().toISOString().substring(0, 16);
            this.selectedClient = null;
            this.selectedUsers = [];

            this.editingItemId = null;
            this.resetFormChanges(); // Сбрасываем состояние изменений
        },
        showDeleteDialog() {
            this.deleteDialog = true;
        },
        closeDeleteDialog() {
            this.deleteDialog = false;
        },
        async handleFileChange(event) {
            if (!this.editingItemId) {
                alert(this.$t('saveProjectFirstThenAttachFiles'));
                event.target.value = '';
                return;
            }
            const files = event.target.files;
            if (!files.length) return;

            this.uploading = true;
            try {
                const uploadedFiles = await ProjectController.uploadFiles(this.editingItemId, files);
                // Обновляем файлы в editingItem для немедленного отображения
                if (this.editingItem && this.editingItem.files) {
                    this.editingItem.files = uploadedFiles;
                }
                event.target.value = '';
            } catch (e) {
                alert('Ошибка загрузки файлов');
            }
            this.uploading = false;
        },
        showDeleteFileDialog(filePath) {
            this.deleteFileIndex = filePath;
            this.deleteFileDialog = true;
        },
        closeDeleteFileDialog() {
            this.deleteFileDialog = false;
            this.deleteFileIndex = -1;
        },
        async confirmDeleteFile() {
            if (this.deleteFileIndex === -1 || !this.editingItemId) return;
            
            try {
                const updatedFiles = await ProjectController.deleteFile(this.editingItemId, this.deleteFileIndex);
                // Обновляем файлы в editingItem для немедленного отображения
                if (this.editingItem && this.editingItem.files) {
                    this.editingItem.files = updatedFiles;
                }
            } catch (e) {
                alert('Ошибка удаления файла');
            }

            this.closeDeleteFileDialog();
        },

    },
    watch: {
        editingItem: {
            handler(newEditingItem) {
                if (newEditingItem) {
                    this.name = newEditingItem.name || '';
                    this.budget = newEditingItem.budget || 0;
                    this.date = newEditingItem.date
                        ? new Date(newEditingItem.date).toISOString().substring(0, 16)
                        : new Date().toISOString().substring(0, 16);
                    this.selectedClient = newEditingItem.client || null;
                    this.selectedUsers = newEditingItem.getUserIds() || [];

                    this.editingItemId = newEditingItem.id || null;
                } else {
                    this.date = new Date().toISOString().substring(0, 16);
                    this.clearForm();
                }
                // Сохраняем новое начальное состояние
                this.$nextTick(() => {
                    this.saveInitialState();
                });
            },
            deep: true,
            immediate: true
        }
    }

}
</script>