<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">{{ editingItem ? $t('editProject') : $t('createProject') }}</h2>
        <TabBar :tabs="translatedTabs" :active-tab="currentTab" :tab-click="(t) => { changeTab(t) }" />
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
        <div v-show="currentTab === 'files' && editingItem">
            <label>{{ $t('files') }}</label>
            <input type="file" multiple @change="handleFileChange" :disabled="uploading" />
            
            <!-- Прогресс загрузки -->
            <div v-if="uploading" class="mt-4 p-4 bg-blue-50 rounded-lg">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-blue-700 font-medium">{{ $t('uploadingFiles') }}...</span>
                    <span class="text-blue-600">{{ uploadProgress }}%</span>
                </div>
                <div class="w-full bg-blue-200 rounded-full h-2">
                    <div class="bg-blue-600 h-2 rounded-full transition-all duration-300" :style="{width: uploadProgress + '%'}"></div>
                </div>
            </div>
            
            <!-- Таблица файлов -->
            <div v-if="editingItem && editingItem.getFormattedFiles().length > 0" class="mt-4">
                <table class="w-full border-collapse border border-gray-300">
                    <thead>
                        <tr class="bg-gray-50">
                            <th class="border border-gray-300 px-3 py-2 text-left font-medium">{{ $t('fileName') }}</th>
                            <th class="border border-gray-300 px-3 py-2 text-left font-medium">{{ $t('fileSize') }}</th>
                            <th class="border border-gray-300 px-3 py-2 text-left font-medium">{{ $t('fileType') }}</th>
                            <th class="border border-gray-300 px-3 py-2 text-left font-medium">{{ $t('actions') }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="file in editingItem.getFormattedFiles()" :key="file.path" class="hover:bg-gray-50">
                            <td class="border border-gray-300 px-3 py-2">
                                <div class="flex items-center gap-3">
                                    <i :class="file.icon" class="text-gray-600 text-xl"></i>
                                    <a :href="file.url" target="_blank" download class="text-blue-600 hover:underline font-medium">
                                        {{ file.name }}
                                    </a>
                                </div>
                            </td>
                            <td class="border border-gray-300 px-3 py-2">{{ formatFileSize(file.size) }}</td>
                            <td class="border border-gray-300 px-3 py-2">{{ file.mimeType || getFileType(file.name) }}</td>
                            <td class="border border-gray-300 px-3 py-2">
                                <PrimaryButton 
                                    icon="fas fa-trash" 
                                    :onclick="() => showDeleteFileDialog(file.path)" 
                                    :is-danger="true"
                                    :is-small="true">
                                    {{ $t('delete') }}
                                </PrimaryButton>
                            </td>
                        </tr>
                    </tbody>
                </table>
                
                <!-- Кнопка массового удаления -->
                <div v-if="selectedFileIds.length > 0" class="mt-4 flex justify-end">
                    <PrimaryButton 
                        icon="fas fa-trash" 
                        :onclick="showDeleteMultipleFilesDialog" 
                        :is-danger="true">
                        {{ $t('deleteSelected') }} ({{ selectedFileIds.length }})
                    </PrimaryButton>
                </div>
            </div>
            
            <!-- Сообщение об отсутствии файлов -->
            <div v-else-if="editingItem && !uploading" class="mt-4 p-4 text-center text-gray-500 bg-gray-50 rounded-lg">
                {{ $t('noFilesUploaded') }}
            </div>
        </div>
        <div v-show="currentTab === 'balance' && editingItem">
            <ProjectBalanceTab :editing-item="editingItem" />
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
        :descr="deleteFileIndex === 'multiple' ? 
            `${$t('confirmDeleteSelected')} (${selectedFileIds.length})?` : 
            `${$t('deleteFileConfirm')} '${editingItem?.files?.[deleteFileIndex]?.name || $t('deleteFileWithoutName')}'`"
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
            uploadProgress: 0,
            deleteFileDialog: false,
            deleteFileIndex: -1,
            selectedFileIds: [],
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
            // Показываем вкладки files и balance только при редактировании существующего проекта
            const availableTabs = this.editingItem ? this.tabs : this.tabs.filter(tab => tab.name === 'info');
            
            return availableTabs.map(tab => ({
                ...tab,
                label: this.$t(tab.label)
            }));
        },

    },
    created() {
        this.fetchUsers()
    },
    mounted() {
        // Сохраняем начальное состояние после монтирования компонента
        this.$nextTick(() => {
            this.saveInitialState();
        });
        
        // Добавляем глобальную функцию для удаления файлов
        window.deleteFile = (filePath) => {
            this.showDeleteFileDialog(filePath);
        };
    },
    methods: {
        changeTab(tabName) {
            // Не позволяем переключиться на вкладки files и balance при создании нового проекта
            if ((tabName === 'files' || tabName === 'balance') && !this.editingItem) {
                return;
            }
            this.currentTab = tabName;
        },
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
            this.uploadProgress = 0;
            
            try {
                // Имитируем прогресс загрузки
                const progressInterval = setInterval(() => {
                    if (this.uploadProgress < 90) {
                        this.uploadProgress += Math.random() * 10;
                    }
                }, 200);

                const uploadedFiles = await ProjectController.uploadFiles(this.editingItemId, files);
                
                clearInterval(progressInterval);
                this.uploadProgress = 100;
                
                // Обновляем файлы в editingItem для немедленного отображения
                if (this.editingItem && this.editingItem.files) {
                    this.editingItem.files = uploadedFiles;
                }
                event.target.value = '';
                
                // Скрываем прогресс через секунду
                setTimeout(() => {
                    this.uploading = false;
                    this.uploadProgress = 0;
                }, 1000);
                
            } catch (e) {
                this.uploading = false;
                this.uploadProgress = 0;
                alert('Ошибка загрузки файлов');
            }
        },
        showDeleteFileDialog(filePath) {
            this.deleteFileIndex = filePath;
            this.deleteFileDialog = true;
        },
        
        showDeleteMultipleFilesDialog() {
            if (this.selectedFileIds.length === 0) return;
            this.deleteFileIndex = 'multiple';
            this.deleteFileDialog = true;
        },
        closeDeleteFileDialog() {
            this.deleteFileDialog = false;
            this.deleteFileIndex = -1;
        },
        async confirmDeleteFile() {
            if (this.deleteFileIndex === -1 || !this.editingItemId) return;
            
            try {
                let updatedFiles;
                
                if (this.deleteFileIndex === 'multiple') {
                    // Массовое удаление выбранных файлов
                    for (const filePath of this.selectedFileIds) {
                        updatedFiles = await ProjectController.deleteFile(this.editingItemId, filePath);
                    }
                    this.selectedFileIds = []; // Очищаем выбранные файлы
                } else {
                    // Удаление одного файла
                    updatedFiles = await ProjectController.deleteFile(this.editingItemId, this.deleteFileIndex);
                }
                
                // Обновляем файлы в editingItem для немедленного отображения
                if (this.editingItem && this.editingItem.files && updatedFiles) {
                    this.editingItem.files = updatedFiles;
                }
            } catch (e) {
                alert('Ошибка удаления файла');
            }

            this.closeDeleteFileDialog();
        },

        // Форматирование размера файла
        formatFileSize(bytes) {
            if (!bytes) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        },

        // Определение типа файла по расширению
        getFileType(filename) {
            if (!filename) return '';
            const ext = filename.split('.').pop().toLowerCase();
            const typeMap = {
                'pdf': 'PDF Document',
                'doc': 'Word Document',
                'docx': 'Word Document',
                'xls': 'Excel Spreadsheet',
                'xlsx': 'Excel Spreadsheet',
                'txt': 'Text Document',
                'png': 'PNG Image',
                'jpg': 'JPEG Image',
                'jpeg': 'JPEG Image',
                'gif': 'GIF Image',
                'zip': 'ZIP Archive',
                'rar': 'RAR Archive'
            };
            return typeMap[ext] || 'Unknown File Type';
        },



    },
    
    beforeUnmount() {
        // Удаляем глобальную функцию при размонтировании
        if (window.deleteFile) {
            delete window.deleteFile;
        }
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
                    // При создании нового проекта всегда показываем вкладку info
                    this.currentTab = "info";
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