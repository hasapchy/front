<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">{{ editingItem ? $t('editTask') : $t('createTask') }}</h2>
        <TabBar :tabs="translatedTabs" :active-tab="currentTab" :tab-click="(t) => { changeTab(t) }" />
        
        <div v-show="currentTab === 'info'">
            <div>
                <label class="required">{{ $t('title') }}</label>
                <input type="text" v-model="title" required />
            </div>
            
            <div>
                <label>{{ $t('description') }}</label>
                <textarea v-model="description" rows="4" :placeholder="$t('enterDescription')"></textarea>
            </div>

            <div>
                <label>{{ $t('status') }}</label>
                <select v-model="statusId">
                    <option v-for="status in taskStatuses" :key="status.id" :value="status.id" >
                        {{ status.name}}
                    </option>
                </select>
            </div>

            <div>
                <label>{{ $t('deadline') }}</label>
                <input 
                    type="datetime-local" 
                    v-model="deadline"
                    :min="minDeadline" />
            </div>

            <div>
                <label>{{ $t('project') }}</label>
                <select v-model="projectId">
                    <option :value="null">{{ $t('no') }}</option>
                    <option v-for="project in projects" :key="project.id" :value="project.id">
                        {{ project.name }}
                    </option>
                </select>
            </div>

            <div>
                <UserSearch v-model:selectedUser="selectedSupervisor" :required="true" :label="$t('supervisor')" />
            </div>

            <div>
                <UserSearch v-model:selectedUser="selectedExecutor" :required="true" :label="$t('executor')" />
            </div>
        </div>
        
        <div v-if="currentTab === 'files'">
            <FileUploader 
                ref="fileUploader" 
                :files="getFormattedFiles()"
                :uploading="uploading" 
                :disabled="false"
                :deleting="deletingFiles" 
                @file-change="handleFileChange" 
                @delete-file="showDeleteFileDialog"
                @delete-multiple-files="showDeleteMultipleFilesDialog" />
        </div>
        
        <!-- <div v-if="currentTab === 'comments' && editingItem && editingItemId" class="h-full">
            <TimelinePanel 
                type="task" 
                :id="editingItemId"
                :is-collapsed="false" />
        </div> -->
    </div>

    <div class="mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
        <PrimaryButton 
            v-if="editingItem != null && $store.getters.hasPermission('tasks_delete_all')"
            :onclick="showDeleteDialog" 
            :is-danger="true" 
            :is-loading="deleteLoading" 
            icon="fas fa-trash">
        </PrimaryButton>
        <PrimaryButton 
            icon="fas fa-save" 
            :onclick="save" 
            :is-loading="saveLoading" 
            :disabled="(editingItemId != null && !$store.getters.hasPermission('tasks_update_all')) ||
                (editingItemId == null && !$store.getters.hasPermission('tasks_create'))">
        </PrimaryButton>
    </div>

    <AlertDialog 
        :dialog="deleteDialog" 
        @confirm="deleteItem" 
        @leave="closeDeleteDialog" 
        :descr="$t('confirmDelete')"
        :confirm-text="$t('delete')" 
        :leave-text="$t('cancel')" />
    
    <AlertDialog 
        :dialog="closeConfirmDialog" 
        @confirm="confirmClose" 
        @leave="cancelClose" 
        :descr="$t('unsavedChanges')"
        :confirm-text="$t('closeWithoutSaving')" 
        :leave-text="$t('stay')" />
    
    <AlertDialog 
        :dialog="deleteFileDialog" 
        @confirm="confirmDeleteFile" 
        @leave="closeDeleteFileDialog"
        :descr="deleteFileIndex === 'multiple' ?
            `${$t('confirmDeleteSelected')} (${selectedFileIds.length})?` :
            `${$t('deleteFileConfirm')} '${editingItem?.files?.[deleteFileIndex]?.name || $t('deleteFileWithoutName')}'`" 
        :confirm-text="$t('deleteFile')" 
        :leave-text="$t('cancel')"
        :confirm-loading="deletingFiles" />
    
    <NotificationToast 
        :title="notificationTitle" 
        :subtitle="notificationSubtitle" 
        :show="notification"
        :is-danger="notificationIsDanger" 
        @close="closeNotification" />
</template>

<script>
import TaskController from '@/api/TaskController';
import UsersController from '@/api/UsersController';
import ProjectController from '@/api/ProjectController';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import NotificationToast from '@/views/components/app/dialog/NotificationToast.vue';
import TabBar from '@/views/components/app/forms/TabBar.vue';
import FileUploader from '@/views/components/app/forms/FileUploader.vue';
import TimelinePanel from '@/views/components/app/dialog/TimelinePanel.vue';
import UserSearch from '@/views/components/app/search/UserSearch.vue';
import TaskDto from '@/dto/task/TaskDto';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import notificationMixin from '@/mixins/notificationMixin';
import formChangesMixin from '@/mixins/formChangesMixin';
import dayjs from 'dayjs';

export default {
    mixins: [getApiErrorMessage, notificationMixin, formChangesMixin],
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', 'close-request','update:editingItem'],
    components: { 
        PrimaryButton, 
        AlertDialog, 
        NotificationToast,
        TabBar,
        FileUploader,
        TimelinePanel,
        UserSearch
    },
    props: {
        editingItem: { type: Object, default: null }
    },
    data() {
        return {
            title: this.editingItem ? this.editingItem.title : '',
            description: this.editingItem ? this.editingItem.description : '',
            statusId: this.editingItem ? (this.editingItem.statusId || this.editingItem.status?.id) : null,
            deadline: this.editingItem && this.editingItem.deadline
                ? dayjs(this.editingItem.deadline).format('YYYY-MM-DDTHH:mm')
                : '',
            minDeadline: dayjs().format('YYYY-MM-DDTHH:mm'),
            projectId: this.editingItem && this.editingItem.project 
                ? this.editingItem.project.id 
                : null,
            selectedSupervisor: this.editingItem && this.editingItem.supervisor 
                ? { id: this.editingItem.supervisor.id } 
                : null,
            selectedExecutor: this.editingItem && this.editingItem.executor 
                ? { id: this.editingItem.executor.id } 
                : null,
            editingItemId: this.editingItem ? this.editingItem.id : null,
            projects: [],
            saveLoading: false,
            deleteDialog: false,
            deleteLoading: false,
            currentTab: 'info',
            tabs: [
                { name: 'info', label: 'info' },
                { name: 'files', label: 'files' },
                // { name: 'comments', label: 'comments' },
            ],
            uploading: false,
            deleteFileDialog: false,
            deleteFileIndex: -1,
            selectedFileIds: [],
            deletingFiles: false,
            pendingFiles: [], // Добавляем массив для файлов до создания задачи
        }
    },
    computed: {
        visibleTabs() {;
            return this.tabs;
        },
        translatedTabs() {
            return this.visibleTabs.map(tab => ({
                ...tab,
                label: this.$t(tab.label)
            }));
        },
        taskStatuses() {
            return this.$store.getters.taskStatuses || [];
        },
        supervisorId() {
            return this.selectedSupervisor?.id || null;
        },
        executorId() {
            return this.selectedExecutor?.id || null;
        },
    },
    watch: {
        editingItem: {
            handler(newEditingItem) {
                
                if (newEditingItem) {
                    this.title = newEditingItem.title || '';
                    this.description = newEditingItem.description || '';
                    this.statusId = newEditingItem.statusId || newEditingItem.status?.id || null;
                    this.deadline = newEditingItem.deadline
                        ? dayjs(newEditingItem.deadline).format('YYYY-MM-DDTHH:mm')
                        : '';
                    this.projectId = newEditingItem.project?.id || null;
                    this.selectedSupervisor = newEditingItem.supervisor?.id ? { id: newEditingItem.supervisor.id } : null;
                    this.selectedExecutor = newEditingItem.executor?.id ? { id: newEditingItem.executor.id } : null;
                    this.editingItemId = newEditingItem.id || null;
                    this.currentTab = 'info';
                } else {
                    this.clearForm();
                }
                this.$nextTick(() => {
                    this.saveInitialState();
                });
            },
            deep: true,
            immediate: true
        }
    },
    mounted() {
        this.$nextTick(async () => {
            if (!this.$store.getters.taskStatuses || this.$store.getters.taskStatuses.length === 0) {
                await this.$store.dispatch('loadTaskStatuses');
            }
            await this.fetchProjects();
            this.saveInitialState();
        });
    },
    methods: {
        clearForm() {
            this.title = '';
            this.description = '';
            this.statusId = 1;
            this.deadline = '';
            this.projectId = null;
            this.selectedSupervisor = null;
            this.selectedExecutor = null;
            this.editingItemId = null;
            this.currentTab = 'info';
            this.pendingFiles = []; // Очищаем pending файлы
            this.resetFormChanges();
        },
        changeTab(tabName) {
            if (!this.visibleTabs.find(tab => tab.name === tabName)) {
                return;
            }
            this.currentTab = tabName;
        },
        async fetchProjects() {
            try {
                const projects = await ProjectController.getListItems();
                this.projects = projects || [];
            } catch (error) {
                console.error('Error fetching projects:', error);
                this.projects = [];
            }
        },
        getFormattedFiles() {
            // Если задача уже создана, используем файлы из editingItem
            if (this.editingItem && this.editingItem.files) {
                const taskDto = new TaskDto(
                    this.editingItem.id,
                    this.editingItem.title,
                    this.editingItem.description,
                    this.editingItem.status_id || null,
                    this.editingItem.status || null,
                    this.editingItem.deadline,
                    this.editingItem.creator?.id,
                    this.editingItem.creator,
                    this.editingItem.supervisor?.id,
                    this.editingItem.supervisor,
                    this.editingItem.executor?.id,
                    this.editingItem.executor,
                    this.editingItem.project?.id || null,
                    this.editingItem.project || null,
                    this.editingItem.company_id,
                    this.editingItem.files || [],
                    this.editingItem.comments || [],
                    this.editingItem.created_at,
                    this.editingItem.updated_at
                );
                return taskDto.getFormattedFiles();
            }
            
            // Если задача еще не создана, форматируем pendingFiles
            if (this.pendingFiles.length > 0) {
                return this.pendingFiles.map((file, index) => ({
                    name: file.name,
                    url: URL.createObjectURL(file),
                    icon: this.getFileIcon(file),
                    path: `pending_${index}`,
                    size: file.size,
                    mimeType: file.type,
                    uploadedAt: new Date().toISOString(),
                    formattedSize: this.formatFileSize(file.size),
                    formattedUploadDate: new Date().toLocaleString(),
                    isPending: true // Флаг для отличия pending файлов
                }));
            }
            
            return [];
        },
        getFileIcon(file) {
            const ext = (file.name || '').split('.').pop().toLowerCase();
            if (['pdf'].includes(ext)) return 'far fa-file-pdf';
            if (['doc', 'docx'].includes(ext)) return 'far fa-file-word';
            if (['xls', 'xlsx'].includes(ext)) return 'far fa-file-excel';
            if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg'].includes(ext)) return 'far fa-file-image';
            if (['zip', 'rar', '7z'].includes(ext)) return 'far fa-file-archive';
            if (['txt', 'md'].includes(ext)) return 'far fa-file-alt';
            return 'far fa-file';
        },
        formatFileSize(bytes) {
            if (!bytes) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        },

        async handleFileChange(files) {
            if (!files || !files.length) return;

            const fileArray = Array.from(files);

            // Если задача еще не создана, сохраняем файлы локально
            if (!this.editingItemId) {
                // Добавляем новые файлы к pendingFiles
                this.pendingFiles = [...this.pendingFiles, ...fileArray];
                return;
            }

            // Если задача уже создана, загружаем файлы на сервер
            const uploadingFileIds = fileArray.map((file, index) => ({
                id: Date.now() + index,
                name: file.name,
                size: file.size,
                progress: 0,
                error: null
            }));

            if (!this.$refs.fileUploader) return;

            this.$refs.fileUploader.uploadingFiles = uploadingFileIds;

            try {
                const progressIntervals = uploadingFileIds.map(fileInfo => {
                    return setInterval(() => {
                        const currentProgress = this.$refs.fileUploader.uploadingFiles.find(f => f.id === fileInfo.id)?.progress || 0;
                        if (currentProgress < 90) {
                            this.$refs.fileUploader.updateUploadProgress(fileInfo.id, currentProgress + Math.random() * 10);
                        }
                    }, 200);
                });

                const uploadedFiles = await TaskController.uploadFiles(this.editingItemId, fileArray);

                progressIntervals.forEach(interval => clearInterval(interval));

                uploadingFileIds.forEach(fileInfo => {
                    this.$refs.fileUploader.updateUploadProgress(fileInfo.id, 100);
                });

                if (this.editingItem) {
                    this.editingItem.files = uploadedFiles;
                }

                setTimeout(() => {
                    this.$refs.fileUploader.uploadingFiles = [];
                }, 2000);

            } catch (error) {
                console.error('Ошибка при загрузке файлов:', error);

                uploadingFileIds.forEach(fileInfo => {
                    this.$refs.fileUploader.updateUploadProgress(fileInfo.id, 0, 'Ошибка загрузки файла');
                });

                alert('Произошла ошибка при загрузке файлов');

                setTimeout(() => {
                    this.$refs.fileUploader.uploadingFiles = [];
                }, 3000);
            }
        },
        async deleteItem() {
            this.deleteLoading = true;
            try {
                await TaskController.deleteItem(this.editingItemId);
                this.showNotification(
                    this.$t('success'), 
                    this.$t('taskSuccessfullyDeleted'), 
                    false
                );
                this.$emit('deleted', this.editingItemId);
            } catch (error) {
                const errorMessage = this.getApiErrorMessage(error);
                this.showNotification(
                    this.$t('error'), 
                    errorMessage, 
                    true
                );
                this.$emit('deleted-error', error);
            } finally {
                this.deleteLoading = false;
                this.deleteDialog = false;
            }
        },
        showDeleteDialog() {
            this.deleteDialog = true;
        },
        closeDeleteDialog() {
            this.deleteDialog = false;
        },
        async handleFileChange(files) {
            if (!files || !files.length) return;

            const fileArray = Array.from(files);

            // Если задача еще не создана, сохраняем файлы локально
            if (!this.editingItemId) {
                // Добавляем новые файлы к pendingFiles
                this.pendingFiles = [...this.pendingFiles, ...fileArray];
                return;
            }

            // Создаем массив файлов для отслеживания прогресса
            const uploadingFileIds = fileArray.map((file, index) => ({
                id: Date.now() + index,
                name: file.name,
                size: file.size,
                progress: 0,
                error: null
            }));

            // Проверяем наличие компонента перед работой с ним
            if (!this.$refs.fileUploader) return;

            // Устанавливаем массив файлов в компонент
            this.$refs.fileUploader.uploadingFiles = uploadingFileIds;

            try {
                // Симулируем прогресс загрузки для всех файлов
                const progressIntervals = uploadingFileIds.map(fileInfo => {
                    return setInterval(() => {
                        // Проверяем наличие компонента перед обращением к нему
                        if (!this.$refs.fileUploader) {
                            return;
                        }
                        const currentProgress = this.$refs.fileUploader.uploadingFiles.find(f => f.id === fileInfo.id)?.progress || 0;
                        if (currentProgress < 90) {
                            this.$refs.fileUploader.updateUploadProgress(fileInfo.id, currentProgress + Math.random() * 10);
                        }
                    }, 200);
                });

                const uploadedFiles = await TaskController.uploadFiles(this.editingItemId, fileArray);

                progressIntervals.forEach(interval => clearInterval(interval));

                // Проверяем наличие компонента перед обновлением прогресса
                if (this.$refs.fileUploader) {
                    uploadingFileIds.forEach(fileInfo => {
                        this.$refs.fileUploader.updateUploadProgress(fileInfo.id, 100);
                    });
                }

                // Обновляем список файлов задачи
                if (this.editingItem) {
                    this.editingItem.files = uploadedFiles;
                }

                setTimeout(() => {
                    if (this.$refs.fileUploader) {
                        this.$refs.fileUploader.uploadingFiles = [];
                    }
                }, 2000);

            } catch (error) {
                console.error('Ошибка при загрузке файлов:', error);

                // Проверяем наличие компонента перед обработкой ошибки
                if (this.$refs.fileUploader) {
                    uploadingFileIds.forEach(fileInfo => {
                        this.$refs.fileUploader.updateUploadProgress(fileInfo.id, 0, 'Ошибка загрузки файла');
                    });

                    setTimeout(() => {
                        if (this.$refs.fileUploader) {
                            this.$refs.fileUploader.uploadingFiles = [];
                        }
                    }, 3000);
                }

                alert('Произошла ошибка при загрузке файлов');
            }
        },
        showDeleteFileDialog(filePath) {
            // Если это pending файл (начинается с "pending_")
            if (filePath.startsWith('pending_')) {
                const index = parseInt(filePath.replace('pending_', ''));
                this.pendingFiles.splice(index, 1);
                return;
            }
            
            // Если задача уже создана, показываем диалог удаления
            if (!this.editingItemId) return;
            
            this.deleteFileIndex = filePath;
            this.deleteFileDialog = true;
        },
        showDeleteMultipleFilesDialog(selectedFileIds) {
            if (!selectedFileIds || selectedFileIds.length === 0) return;
            
            // Фильтруем pending файлы
            const pendingIndices = selectedFileIds
                .filter(id => id.startsWith('pending_'))
                .map(id => parseInt(id.replace('pending_', '')))
                .sort((a, b) => b - a); // Сортируем по убыванию для правильного удаления
            
            // Удаляем pending файлы
            pendingIndices.forEach(index => {
                this.pendingFiles.splice(index, 1);
            });
            
            // Остальные файлы удаляем через диалог (если задача создана)
            const remainingIds = selectedFileIds.filter(id => !id.startsWith('pending_'));
            if (remainingIds.length > 0 && this.editingItemId) {
                this.selectedFileIds = remainingIds;
                this.deleteFileIndex = 'multiple';
                this.deleteFileDialog = true;
            } else if (this.$refs.fileUploader) {
                this.$refs.fileUploader.selectedFileIds = [];
            }
        },
        async save() {
            if (this.uploading) {
                alert(this.$t('waitForFileUpload') || 'Дождитесь завершения загрузки файлов');
                return;
            }

            if (!this.title || this.title.trim() === '') {
                this.showNotification(
                    this.$t('error'), 
                    this.$t('titleRequired') || 'Заголовок обязателен', 
                    true
                );
                return;
            }

            if (!this.supervisorId) {
                this.showNotification(
                    this.$t('error'), 
                    this.$t('supervisorRequired') || 'Постановщик обязателен', 
                    true
                );
                return;
            }

            if (!this.executorId) {
                this.showNotification(
                    this.$t('error'), 
                    this.$t('executorRequired') || 'Исполнитель обязателен', 
                    true
                );
                return;
            }

            this.saveLoading = true;
            try {
                const data = {
                    title: this.title.trim(),
                    description: this.description || null,
                    status_id: this.statusId || null,
                    deadline: this.deadline ? dayjs(this.deadline).format('YYYY-MM-DD HH:mm:ss') : null,
                    project_id: this.projectId || null,
                    supervisor_id: this.supervisorId,
                    executor_id: this.executorId,
                };

                let response;
                if (this.editingItemId) {
                    response = await TaskController.updateItem(this.editingItemId, data);
                    
                    // Получаем обновленную задачу с сервера, чтобы получить актуальный список файлов
                    try {
                        const updatedTask = await TaskController.getItem(this.editingItemId);
                        if (updatedTask) {
                            response.data = updatedTask;
                        }
                    } catch (error) {
                        console.error('Ошибка при получении обновленной задачи:', error);
                        // Продолжаем с response.data, даже если не удалось получить обновленную задачу
                    }
                } else {
                    // Создаем задачу
                    response = await TaskController.createItem(data);
                    this.editingItemId = response.data.id;
                    
                    // Если есть pending файлы, загружаем их после создания задачи
                    if (this.pendingFiles.length > 0) {
                        try {
                            await TaskController.uploadFiles(this.editingItemId, this.pendingFiles);
                            
                            // Очищаем pending файлы
                            this.pendingFiles = [];
                            
                            // Получаем обновленную задачу с сервера, чтобы получить актуальный список файлов
                            const updatedTask = await TaskController.getItem(this.editingItemId);
                            if (updatedTask) {
                                response.data = updatedTask;
                            }
                        } catch (fileError) {
                            console.error('Ошибка при загрузке файлов после создания задачи:', fileError);
                            this.showNotification(
                                this.$t('error'), 
                                'Задача создана, но произошла ошибка при загрузке файлов', 
                                true
                            );
                        }
                    }
                }

                // Обновляем editingItem актуальными данными с сервера
                if (response && response.data) {
                    this.$emit('update:editingItem', response.data);
                }

                this.showNotification(
                    this.$t('success'), 
                    this.editingItemId ? this.$t('taskSuccessfullyUpdated') : this.$t('taskSuccessfullyAdded'), 
                    false
                );
                
                this.saveInitialState();
                this.$emit('saved', response.data);
            } catch (error) {
                const errorMessage = this.getApiErrorMessage(error);
                this.showNotification(
                    this.$t('error'), 
                    errorMessage, 
                    true
                );
                this.$emit('saved-error', error);
            } finally {
                this.saveLoading = false;
            }
        },
        closeDeleteFileDialog() {
            this.deleteFileDialog = false;
            this.deleteFileIndex = -1;
        },

        async confirmDeleteFile() {
            if (this.deleteFileIndex === -1 || !this.editingItemId) return;

            this.deletingFiles = true;

            try {
                let updatedFiles;

                if (this.deleteFileIndex === 'multiple') {
                    for (const filePath of this.selectedFileIds) {
                        updatedFiles = await TaskController.deleteFile(this.editingItemId, filePath);
                    }
                    if (this.$refs.fileUploader) {
                        this.$refs.fileUploader.selectedFileIds = [];
                    }
                    this.selectedFileIds = [];
                } else {
                    updatedFiles = await TaskController.deleteFile(this.editingItemId, this.deleteFileIndex);
                }

                // Получаем обновленную задачу с сервера, чтобы получить актуальный список файлов
                let updatedTask = null;
                try {
                    updatedTask = await TaskController.getItem(this.editingItemId);
                } catch (error) {
                    console.error('Ошибка при получении обновленной задачи:', error);
                }
                
                if (updatedTask && this.editingItem) {
                    // Обновляем editingItem с актуальными данными
                    this.editingItem.files = updatedTask.files || [];
                    
                    // Эмитим обновление для родительского компонента
                    this.$emit('update:editingItem', updatedTask);
                } else if (this.editingItem && updatedFiles) {
                    // Fallback: если не удалось получить задачу, используем updatedFiles
                    this.editingItem.files = updatedFiles;
                }
                
                this.showNotification(
                    this.$t('success'), 
                    this.$t('fileDeletedSuccessfully') || 'Файл успешно удален', 
                    false
                );
            } catch (e) {
                console.error('Ошибка удаления файла:', e);
                this.showNotification(
                    this.$t('error'), 
                    this.getApiErrorMessage(e) || 'Ошибка удаления файла', 
                    true
                );
            } finally {
                this.deletingFiles = false;
                this.closeDeleteFileDialog();
            }
        },

        getInitialState() {
            return {
                title: this.title,
                description: this.description,
                statusId: this.statusId,
                deadline: this.deadline,
                projectId: this.projectId,
                supervisorId: this.selectedSupervisor?.id || null,
                executorId: this.selectedExecutor?.id || null,
            };
        },
    },
}
</script>
