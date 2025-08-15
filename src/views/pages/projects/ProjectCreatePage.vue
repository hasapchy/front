<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">{{ editingItem ? editingItem.name : 'Проект' }}</h2>
        <TabBar :tabs="tabs" :active-tab="currentTab" :tab-click="(t) => { if (!uploading) currentTab = t }" />
        <div v-show="currentTab === 'info'">
            <ClientSearch v-model:selectedClient="selectedClient" :disabled="!!editingItemId" />
            <div>
                <label class="required">Название</label>
                <input type="text" v-model="name">
            </div>
            <div>
                <label>Дата проекта</label>
                <input type="datetime-local" v-model="date" :disabled="!!editingItemId">
            </div>
            <div>
                <label>Бюджет проекта</label>
                <input type="number" v-model="budget">
            </div>
            <div>
                <label class="required">Назначить пользователей</label>
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
            <label class="text-lg font-medium text-gray-700 mb-4 block">Файлы проекта</label>
            <input type="file" multiple @change="handleFileChange" :disabled="uploading" 
                   class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            
            <!-- Индикатор загрузки -->
            <div v-if="uploading" class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div class="flex items-center space-x-3">
                    <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span class="text-blue-800">Загрузка файлов...</span>
                </div>
            </div>
            
            <!-- Список файлов -->
            <div v-if="editingItem && editingItem.hasFiles()" class="mt-6">
                <h3 class="text-md font-medium text-gray-700 mb-3">Прикрепленные файлы ({{ editingItem.getFilesCount() }})</h3>
                <div class="grid gap-3">
                    <div v-for="file in editingItem.getFormattedFiles()" :key="file.path" 
                         class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                        <div class="flex items-start justify-between">
                            <div class="flex items-start space-x-3 flex-1">
                                <!-- Иконка файла -->
                                <div class="flex-shrink-0">
                                    <div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                        <i :class="file.icon" class="text-gray-600 text-lg"></i>
                                    </div>
                                </div>
                                
                                <!-- Информация о файле -->
                                <div class="flex-1 min-w-0">
                                    <h4 class="text-sm font-medium text-gray-900 truncate">
                                        <a :href="file.url" target="_blank" download 
                                           class="hover:text-blue-600 transition-colors duration-200">
                                            {{ file.name }}
                                        </a>
                                    </h4>
                                    <div class="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                                        <span v-if="file.formattedSize" class="flex items-center">
                                            <i class="fas fa-weight-hanging mr-1"></i>
                                            {{ file.formattedSize }}
                                        </span>
                                        <span v-if="file.formattedUploadDate" class="flex items-center">
                                            <i class="fas fa-calendar-alt mr-1"></i>
                                            {{ file.formattedUploadDate }}
                                        </span>
                                        <span class="flex items-center">
                                            <i class="fas fa-file mr-1"></i>
                                            {{ file.mimeType || 'Неизвестный тип' }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Кнопка удаления -->
                            <div class="flex-shrink-0 ml-3">
                                <PrimaryButton 
                                    :onclick="() => showDeleteFileDialog(file.path)"
                                    :is-danger="true"
                                    icon="fas fa-trash"
                                    class="!px-2 !py-1 text-xs">
                                    Удалить
                                </PrimaryButton>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Сообщение об отсутствии файлов -->
            <div v-else-if="editingItem" class="mt-6 p-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg text-center">
                <div class="text-gray-400 mb-3">
                    <i class="fas fa-file-upload text-4xl"></i>
                </div>
                <h3 class="text-lg font-medium text-gray-600 mb-2">Файлы не прикреплены</h3>
                <p class="text-gray-500">Загрузите файлы для проекта, используя поле выше</p>
            </div>
        </div>
        <div v-show="currentTab === 'balance'">
            <ProjectBalanceTab v-if="editingItem" :editing-item="editingItem" />
        </div>
    </div>
    <div class="mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
        <PrimaryButton v-if="editingItem != null" :onclick="showDeleteDialog" :is-danger="true"
            :is-loading="deleteLoading" icon="fas fa-remove"
            :disabled="!$store.getters.hasPermission('projects_delete') || uploading">
            Удалить
        </PrimaryButton>
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading" :disabled="(editingItemId != null && !$store.getters.hasPermission('projects_update')) ||
            (editingItemId == null && !$store.getters.hasPermission('projects_create')) || uploading">
            Сохранить
        </PrimaryButton>
    </div>
    <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog"
        :descr="'Подтвердите удаление проекта'" :confirm-text="'Удалить проект'" :leave-text="'Отмена'" />
    <AlertDialog :dialog="closeConfirmDialog" @confirm="confirmClose" @leave="cancelClose"
        :descr="uploading ? 'Дождитесь завершения загрузки файлов перед закрытием формы' : 'У вас есть несохраненные изменения. Вы действительно хотите закрыть форму?'" 
        :confirm-text="uploading ? 'Ок' : 'Закрыть без сохранения'" 
        :leave-text="uploading ? 'Ок' : 'Остаться'" />
    <AlertDialog :dialog="deleteFileDialog" @confirm="confirmDeleteFile" @leave="closeDeleteFileDialog"
        :descr="`Подтвердите удаление файла '${editingItem?.files?.find(f => f.path === deleteFileIndex)?.name || 'без имени'}'`"
        :confirm-text="'Удалить файл'" :leave-text="'Отмена'" />
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
                { name: 'info', label: 'Информация' },
                { name: 'files', label: 'Файлы' },
                { name: "balance", label: "Баланс" },
            ],
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
                alert('Дождитесь завершения загрузки файлов');
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
                alert('Сначала сохраните проект, затем прикрепляйте файлы');
                event.target.value = '';
                return;
            }
            const files = event.target.files;
            if (!files.length) return;

            this.uploading = true;
            try {
                const uploadedFiles = await ProjectController.uploadFiles(this.editingItemId, files);
                // Обновляем файлы в editingItem для немедленного отображения
                if (this.editingItem) {
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
                if (this.editingItem) {
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