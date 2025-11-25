<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">{{ editingItem ? $t('editTask') : $t('createTask') }}</h2>
        
        <div>
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
                <label>{{ $t('supervisor') }}</label>
                <select v-model="supervisorId">
                    <option :value="null">{{ $t('no') }}</option>
                    <option v-for="user in users" :key="user.id" :value="user.id">
                        {{ user.name }}
                    </option>
                </select>
            </div>

            <div>
                <label>{{ $t('executor') }}</label>
                <select v-model="executorId">
                    <option :value="null">{{ $t('no') }}</option>
                    <option v-for="user in users" :key="user.id" :value="user.id">
                        {{ user.name }}
                    </option>
                </select>
            </div>
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
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import notificationMixin from '@/mixins/notificationMixin';
import formChangesMixin from '@/mixins/formChangesMixin';

export default {
    mixins: [getApiErrorMessage, notificationMixin, formChangesMixin],
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', 'close-request'],
    components: { 
        PrimaryButton, 
        AlertDialog, 
        NotificationToast 
    },
    props: {
        editingItem: { type: Object, default: null }
    },
    data() {
        return {
            title: this.editingItem ? this.editingItem.title : '',
            description: this.editingItem ? this.editingItem.description : '',
            status: this.editingItem ? this.editingItem.status : 'pending',
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
        async fetchUsers() {
            try {
                const users = await UsersController.getAllItems();
                this.users = users || [];
            } catch (error) {
                console.error('Error fetching users:', error);
                this.users = [];
            }
        },
        async fetchProjects() {
            try {
                const projects = await ProjectController.getAllItems();
                this.projects = projects || [];
            } catch (error) {
                console.error('Error fetching projects:', error);
                this.projects = [];
            }
        },
        async save() {
            if (!this.title || this.title.trim() === '') {
                this.showNotification(
                    this.$t('error'), 
                    this.$t('titleRequired'), 
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
                    supervisor_id: this.supervisorId || null,
                    executor_id: this.executorId || null,
                };

                let response;
                if (this.editingItemId) {
                    response = await TaskController.updateItem(this.editingItemId, data);
                } else {
                    response = await TaskController.createItem(data);
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
