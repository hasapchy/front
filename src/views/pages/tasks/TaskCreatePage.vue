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
                <select v-model="status">
                    <option value="pending">{{ $t('pending') }}</option>
                    <option value="in_progress">{{ $t('inProgress') }}</option>
                    <option value="completed">{{ $t('completed') }}</option>
                    <option value="postponed">{{ $t('postponed') }}</option>
                </select>
            </div>

            <div>
                <label>{{ $t('deadline') }}</label>
                <input 
                    type="datetime-local" 
                    v-model="deadline"
                    :min="new Date().toISOString().substring(0, 16)" />
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
                <label class="required">{{ $t('supervisor') }}</label>
                <select v-model="supervisorId" required>
                    <option :value="null">{{ $t('select') }}</option>
                    <option v-for="user in users" :key="user.id" :value="user.id">
                        {{ user.name }}
                    </option>
                </select>
            </div>

            <div>
                <label class="required">{{ $t('executor') }}</label>
                <select v-model="executorId" required>
                    <option :value="null">{{ $t('select') }}</option>
                    <option v-for="user in users" :key="user.id" :value="user.id">
                        {{ user.name }}
                    </option>
                </select>
            </div>
        </div>
        
        <div v-if="currentTab === 'files' && editingItem && editingItemId">
            <FileUploader 
                ref="fileUploader" 
                :files="editingItem ? getFormattedFiles() : []"
                :uploading="uploading" 
                :disabled="!editingItemId"
                :deleting="deletingFiles" 
                @file-change="handleFileChange" 
                @delete-file="showDeleteFileDialog"
                @delete-multiple-files="showDeleteMultipleFilesDialog" />
        </div>
        
        <div v-if="currentTab === 'comments' && editingItem && editingItemId" class="h-full">
            <TimelinePanel 
                type="task" 
                :id="editingItemId"
                :is-collapsed="false" />
        </div>
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
import TaskDto from '@/dto/task/TaskDto';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import notificationMixin from '@/mixins/notificationMixin';
import formChangesMixin from '@/mixins/formChangesMixin';

export default {
    mixins: [getApiErrorMessage, notificationMixin, formChangesMixin],
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', 'close-request'],
    components: { 
        PrimaryButton, 
        AlertDialog, 
        NotificationToast,
        TabBar,
        FileUploader,
        TimelinePanel
    },
    props: {
        editingItem: { type: Object, default: null }
    },
    data() {
        return {
            title: this.editingItem ? this.editingItem.title : '',
            description: this.editingItem ? this.editingItem.description : '',
            status: this.editingItem ? this.editingItem.status : 'in_progress',
            deadline: this.editingItem && this.editingItem.deadline
                ? new Date(this.editingItem.deadline).toISOString().substring(0, 16)
                : '',
            projectId: this.editingItem && this.editingItem.project 
                ? this.editingItem.project.id 
                : null,
            supervisorId: this.editingItem && this.editingItem.supervisor 
                ? this.editingItem.supervisor.id 
                : null,
            executorId: this.editingItem && this.editingItem.executor 
                ? this.editingItem.executor.id 
                : null,
            editingItemId: this.editingItem ? this.editingItem.id : null,
            users: [],
            projects: [],
            saveLoading: false,
            deleteDialog: false,
            deleteLoading: false,
            currentTab: 'info',
            tabs: [
                { name: 'info', label: 'info' },
                { name: 'files', label: 'files' },
                { name: 'comments', label: 'comments' },
            ],
            uploading: false,
            deleteFileDialog: false,
            deleteFileIndex: -1,
            selectedFileIds: [],
            deletingFiles: false,
        }
    },
    computed: {
        visibleTabs() {
            const baseTabs = this.editingItem ? this.tabs : this.tabs.filter(tab => tab.name === 'info');
            return baseTabs;
        },
        translatedTabs() {
            return this.visibleTabs.map(tab => ({
                ...tab,
                label: this.$t(tab.label)
            }));
        },
    },
    watch: {
        editingItem: {
            handler(newEditingItem) {
                if (newEditingItem) {
                    this.title = newEditingItem.title || '';
                    this.description = newEditingItem.description || '';
                    this.status = newEditingItem.status || 'in_progress';
                    this.deadline = newEditingItem.deadline
                        ? new Date(newEditingItem.deadline).toISOString().substring(0, 16)
                        : '';
                    this.projectId = newEditingItem.project?.id || null;
                    this.supervisorId = newEditingItem.supervisor?.id || null;
                    this.executorId = newEditingItem.executor?.id || null;
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
            await Promise.all([
                this.fetchUsers(),
                this.fetchProjects()
            ]);
            this.saveInitialState();
        });
    },
    methods: {
        clearForm() {
            this.title = '';
            this.description = '';
            this.status = 'in_progress';
            this.deadline = '';
            this.projectId = null;
            this.supervisorId = null;
            this.executorId = null;
            this.editingItemId = null;
            this.currentTab = 'info';
            this.resetFormChanges();
        },
        changeTab(tabName) {
            if (!this.visibleTabs.find(tab => tab.name === tabName)) {
                return;
            }
            this.currentTab = tabName;
        },
        async fetchUsers() {
            try {
                const users = await UsersController.getListItems();
                console.log(users);
                console.log("***---***");
                this.users = users || [];
            } catch (error) {
                console.error('Error fetching users:', error);
                this.users = [];
            }
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
            if (!this.editingItem || !this.editingItem.files) return [];
            const taskDto = new TaskDto(
                this.editingItem.id,
                this.editingItem.title,
                this.editingItem.description,
                this.editingItem.status,
                this.editingItem.deadline,
                this.editingItem.creator?.id,
                this.editingItem.creator,
                this.editingItem.supervisor?.id,
                this.editingItem.supervisor,
                this.editingItem.executor?.id,
                this.editingItem.executor,
                this.editingItem.project?.id,
                this.editingItem.project,
                this.editingItem.company_id,
                this.editingItem.files || [],
                this.editingItem.comments || [],
                this.editingItem.created_at,
                this.editingItem.updated_at
            );
            return taskDto.getFormattedFiles();
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
                    status: this.status,
                    deadline: this.deadline || null,
                    project_id: this.projectId || null,
                    supervisor_id: this.supervisorId,
                    executor_id: this.executorId,
                };

                let response;
                if (this.editingItemId) {
                    response = await TaskController.updateItem(this.editingItemId, data);
                } else {
                    response = await TaskController.createItem(data);
                    this.editingItemId = response.data.id;
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
            if (!this.editingItemId) {
                alert(this.$t('saveTaskFirstThenAttachFiles') || 'Сначала сохраните задачу, затем прикрепите файлы');
                return;
            }
            if (!files || !files.length) return;

            const fileArray = Array.from(files);

            const uploadingFileIds = fileArray.map((file, index) => ({
                id: Date.now() + index,
                name: file.name,
                size: file.size,
                progress: 0,
                error: null
            }));

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

                if (this.editingItem && this.editingItem.files) {
                    this.editingItem.files = uploadedFiles.files;
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
        showDeleteFileDialog(filePath) {
            this.deleteFileIndex = filePath;
            this.deleteFileDialog = true;
        },
        showDeleteMultipleFilesDialog(selectedFileIds) {
            if (!selectedFileIds || selectedFileIds.length === 0) return;
            this.selectedFileIds = selectedFileIds;
            this.deleteFileIndex = 'multiple';
            this.deleteFileDialog = true;
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

                if (this.editingItem && this.editingItem.files && updatedFiles) {
                    this.editingItem.files = updatedFiles.files;
                }
            } catch (e) {
                alert('Ошибка удаления файла');
            } finally {
                this.deletingFiles = false;
                this.closeDeleteFileDialog();
            }
        },
        getInitialState() {
            return {
                title: this.title,
                description: this.description,
                status: this.status,
                deadline: this.deadline,
                projectId: this.projectId,
                supervisorId: this.supervisorId,
                executorId: this.executorId,
            };
        },
    },
}
</script>
