<template>
    <div class="flex h-full min-h-0 flex-col">
        <div class="app-form-scroll-container">
            <div class="space-y-4">
                <div>
                    <label class="required">{{ $t('title') }}</label>
                    <input v-model="title" type="text" required>
                </div>

                <div>
                    <label>{{ $t('description') }}</label>
                    <QuillEditor
                        :key="quillEditorKey"
                        :content="description"
                        content-type="html"
                        :options="editorOptions"
                        :disabled="saveLoading"
                        @update:content="description = $event"
                    />
                </div>

                <div class="hidden">
                    <label>{{ $t('status') }}</label>
                    <select v-model="statusId">
                        <option v-for="status in taskStatuses" :key="status.id" :value="status.id">
                            {{ translateTaskStatus(status.name, $t) }}
                        </option>
                    </select>
                </div>

                <div>
                    <label>{{ $t('deadline') }}</label>
                    <div ref="dateInputWrapper" class="relative">
                        <input type="text" :value="formattedDeadline" readonly class="cursor-pointer pr-8"
                            :placeholder="$t('noDeadline')" @click.stop="handleInputClick">
                        <div class="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                            <i v-if="deadline" class="fas fa-times text-gray-400 hover:text-gray-600 cursor-pointer"
                                @click.stop="clearDeadline" />
                            <i class="fas fa-calendar text-gray-400 pointer-events-none" />
                        </div>

                        <div v-if="showDatePicker" ref="datePickerWrapper" class="absolute z-50 mt-2"
                            style="left: 0; top: 100%;">
                            <DatePicker :model-value="deadline" type="datetime" :restrict-to-now="false"
                                @update:model-value="handleDateChange" @apply="showDatePicker = false"
                                @clear="clearDeadline" />
                        </div>
                    </div>
                </div>

                <div class="flex flex-col gap-4 sm:flex-row">
                    <div class="min-w-0 flex-1">
                        <label>{{ $t('priority') }}</label>
                        <div class="flex items-center gap-2 mt-1">
                            <button type="button" class="text-xl focus:outline-none"
                                :class="priorityLevel >= 1 ? 'text-[var(--color-warning)]' : 'text-gray-300 opacity-40'"
                                @click="priority = 'low'">
                                🔥
                            </button>
                            <button type="button" class="text-xl focus:outline-none"
                                :class="priorityLevel >= 2 ? 'text-[var(--color-warning)]' : 'text-gray-300 opacity-40'"
                                @click="priority = 'normal'">
                                🔥
                            </button>
                            <button type="button" class="text-xl focus:outline-none"
                                :class="priorityLevel >= 3 ? 'text-[var(--color-warning)]' : 'text-gray-300 opacity-40'"
                                @click="priority = 'high'">
                                🔥
                            </button>
                        </div>
                    </div>

                    <div class="min-w-0 flex-1">
                        <label>{{ $t('complexity') }}</label>
                        <div class="flex items-center gap-2 mt-1">
                            <button type="button" class="text-xl focus:outline-none"
                                :class="complexityLevel >= 1 ? 'text-[var(--color-info)]' : 'text-gray-300 opacity-40'"
                                @click="complexity = 'simple'">
                                🧠
                            </button>
                            <button type="button" class="text-xl focus:outline-none"
                                :class="complexityLevel >= 2 ? 'text-[var(--color-info)]' : 'text-gray-300 opacity-40'"
                                @click="complexity = 'normal'">
                                🧠
                            </button>
                            <button type="button" class="text-xl focus:outline-none"
                                :class="complexityLevel >= 3 ? 'text-[var(--color-info)]' : 'text-gray-300 opacity-40'"
                                @click="complexity = 'complex'">
                                🧠
                            </button>
                        </div>
                    </div>
                </div>

                <div>
                    <ProjectSearch :selected-project="selectedProject" :project-id="projectId"
                        :active-projects-only="false" @update:selected-project="onSelectedProjectUpdate" />
                </div>

                <div class="flex flex-col gap-4 sm:flex-row">
                    <div class="min-w-0 flex-1">
                        <UserSearch :selected-user="selectedSupervisor" @update:selected-user="selectedSupervisor = $event" :required="true" :label="$t('supervisor')" />
                    </div>
                    <div class="min-w-0 flex-1">
                        <UserSearch :selected-user="selectedExecutor" @update:selected-user="selectedExecutor = $event" :required="true" :label="$t('executor')" />
                    </div>
                </div>

                <div>
                    <UserSearch
                        :selected-users="selectedObserverIds"
                        :multiple="true"
                        :label="$t('taskObservers')"
                        @update:selected-users="selectedObserverIds = $event"
                    />
                </div>

                <div v-if="projectId">
                    <label class="inline-flex items-center gap-2 cursor-pointer">
                        <input v-model="openToProjectParticipants" type="checkbox">
                        <span>{{ $t('taskOpenToProjectParticipants') }}</span>
                    </label>
                    <FieldHint :text="$t('taskRestrictVisibilityHint')" placement="top" />
                </div>
            </div>

            <div class="mt-6 min-w-0 space-y-4 border-t border-gray-200 pb-2 pt-4 dark:border-[var(--border-subtle)]">
                <TaskChecklist
                    :items="checklistItems"
                    embedded
                    scrollable
                    @update:items="checklistItems = $event"
                />

                <TaskFilesPreview :files="formattedFiles" />

                <div class="flex flex-wrap gap-2">
                    <TaskFormSectionChip
                        icon="fas fa-tasks"
                        :label="$t('checklist')"
                        :badge="checklistChipBadge"
                        @click="checklistDialogOpen = true"
                    />
                    <TaskFormSectionChip
                        icon="fas fa-paperclip"
                        :label="$t('files')"
                        :badge="filesChipBadge"
                        @click="filesDialogOpen = true"
                    />
                </div>
            </div>
        </div>

        <teleport v-bind="sideModalFooterTeleportBind">
            <div class="flex w-full flex-wrap items-center gap-2">
                <PrimaryButton v-if="editingItem != null && $store.getters.hasPermission('tasks_delete_all')"
                    :onclick="showDeleteDialog" :is-danger="true" :is-loading="deleteLoading" icon="fas fa-trash" />
                <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading" :disabled="(editingItemId != null && !$store.getters.hasPermission('tasks_update_all')) ||
                    (editingItemId == null && !$store.getters.hasPermission('tasks_create'))" />
            </div>
        </teleport>

        <CenteredModalDialog
            :show-form="checklistDialogOpen"
            :title="$t('checklist')"
            overlay-class="z-[130]"
            panel-class="max-w-lg max-h-[85vh] overflow-y-auto"
            :onclose="closeChecklistDialog"
        >
            <TaskChecklist
                :items="checklistItems"
                :show-header="false"
                @update:items="checklistItems = $event"
            />
        </CenteredModalDialog>

        <CenteredModalDialog
            :show-form="filesDialogOpen"
            :title="$t('files')"
            overlay-class="z-[130]"
            panel-class="max-w-3xl max-h-[85vh] overflow-y-auto"
            :onclose="closeFilesDialog"
        >
            <FileUploader
                ref="fileUploader"
                :files="formattedFiles"
                :uploading="uploading"
                :disabled="false"
                :deleting="deletingFiles"
                :enable-fullscreen-drop="true"
                @file-change="handleFileChange"
                @delete-file="showDeleteFileDialog"
                @delete-multiple-files="showDeleteMultipleFilesDialog"
            />
        </CenteredModalDialog>

        <AlertDialog :dialog="deleteDialog" :on-confirm="deleteItem" :on-leave="closeDeleteDialog"
            :descr="$t('confirmDelete')" :confirm-text="$t('delete')" :leave-text="$t('cancel')" />

        <AlertDialog :dialog="closeConfirmDialog" :on-confirm="confirmClose" :on-leave="cancelClose"
            :descr="$t('unsavedChanges')" :confirm-text="$t('closeWithoutSaving')" :leave-text="$t('stay')" />

        <AlertDialog :dialog="deleteFileDialog" :on-confirm="confirmDeleteFile" :on-leave="closeDeleteFileDialog" :descr="deleteFileIndex === 'multiple' ?
            `${$t('confirmDeleteSelected')} (${selectedFileIds.length})?` :
            `${$t('deleteFileConfirm')} '${editingItem?.files?.[deleteFileIndex]?.name || $t('deleteFileWithoutName')}'`"
            :confirm-text="$t('deleteFile')" :leave-text="$t('cancel')" :confirm-loading="deletingFiles" />
    </div>
</template>

<script>
import TaskController from '@/api/TaskController';
import { defineAsyncComponent } from 'vue';
import '@vueup/vue-quill/dist/vue-quill.snow.css';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import CenteredModalDialog from '@/views/components/app/dialog/CenteredModalDialog.vue';
import FileUploader from '@/views/components/app/forms/FileUploader.vue';
import UserSearch from '@/views/components/app/search/UserSearch.vue';
import ProjectSearch from '@/views/components/app/search/ProjectSearch.vue';
import DatePicker from '@/views/components/app/forms/DatePicker.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import notificationMixin from '@/mixins/notificationMixin';
import crudFormMixin from '@/mixins/crudFormMixin';
import projectSelectionMixin from '@/mixins/projectSelectionMixin';
import { sideModalFooterPortal } from '@/views/components/app/dialog/SideModalDialog.vue';
import dayjs from 'dayjs';
import { dateFormMixin, getCurrentServerDateObject } from '@/utils/dateUtils';
import { getDefaultTaskDeadline } from '@/utils/taskDefaultDeadline';
import { translateTaskStatus } from '@/utils/translationUtils';
import { applyProjectSelection } from '@/utils/projectSearchUtils';
import TaskChecklist from '@/views/components/app/task/TaskChecklist.vue';
import TaskFilesPreview from '@/views/components/app/task/TaskFilesPreview.vue';
import TaskFormSectionChip from '@/views/components/app/task/TaskFormSectionChip.vue';
import FieldHint from '@/views/components/app/forms/FieldHint.vue';

const QuillEditor = defineAsyncComponent(async () => (await import('@vueup/vue-quill')).QuillEditor);

function resolveTaskSupervisor(editingItem, currentUser) {
    if (!editingItem) {
        return currentUser;
    }
    return editingItem.supervisor
        ?? (editingItem.supervisorId ? { id: editingItem.supervisorId } : currentUser);
}

function resolveTaskExecutor(editingItem) {
    if (!editingItem) {
        return null;
    }
    return editingItem.executor
        ?? (editingItem.executorId ? { id: editingItem.executorId } : null);
}

function resolveObserverIds(editingItem) {
    if (!editingItem?.observers?.length) {
        return [];
    }
    return editingItem.observers.map((user) => Number(user.id)).filter(Boolean);
}

function parseTaskChecklist(checklist) {
    if (!checklist) {
        return [];
    }
    if (Array.isArray(checklist)) {
        return [...checklist];
    }
    try {
        return JSON.parse(String(checklist));
    } catch {
        return [];
    }
}

export default {
    components: {
        PrimaryButton,
        AlertDialog,
        CenteredModalDialog,
        FileUploader,
        UserSearch,
        ProjectSearch,
        DatePicker,
        QuillEditor,
        TaskChecklist,
        TaskFilesPreview,
        TaskFormSectionChip,
        FieldHint
    },
    mixins: [getApiErrorMessage, notificationMixin, dateFormMixin, crudFormMixin, sideModalFooterPortal, projectSelectionMixin],
    props: {
        editingItem: { type: Object, default: null },
        initialDraft: { type: Object, default: null },
    },
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', 'close-request', 'update:editingItem', 'initial-draft-applied'],
    data() {
        return {
            title: this.editingItem ? this.editingItem.title : (this.initialDraft?.title ?? ''),
            description: this.editingItem ? this.editingItem.description : (this.initialDraft?.description ?? ''),
            statusId: this.editingItem ? this.editingItem.statusId : null,
            deadline: this.editingItem?.deadline
                ? this.getFormattedDate(this.editingItem.deadline)
                : (this.editingItem ? null : (this.initialDraft?.deadline || this.getDefaultDeadline())),
            projectId: this.editingItem && this.editingItem.project
                ? this.editingItem.project.id
                : (this.initialDraft?.projectId ?? null),
            selectedProject: this.editingItem?.project ?? (this.initialDraft?.project ?? null),
            selectedSupervisor: this.editingItem
                ? resolveTaskSupervisor(this.editingItem, this.$store.state.user)
                : (this.initialDraft?.supervisor ?? this.$store.state.user),
            selectedExecutor: this.editingItem
                ? resolveTaskExecutor(this.editingItem)
                : (this.initialDraft?.executor ?? null),
            selectedObserverIds: resolveObserverIds(this.editingItem),
            openToProjectParticipants: this.editingItem ? this.editingItem.restrictVisibility === false : false,
            priority: this.editingItem ? (this.editingItem.priority || 'low') : 'low',
            complexity: this.editingItem ? (this.editingItem.complexity || 'normal') : 'normal',
            uploading: false,
            checklistDialogOpen: false,
            filesDialogOpen: false,
            deleteFileDialog: false,
            deleteFileIndex: -1,
            selectedFileIds: [],
            deletingFiles: false,
            pendingFiles: [], // Добавляем массив для файлов до создания задачи
            showDatePicker: false,
            checklistItems: parseTaskChecklist(this.editingItem?.checklist),
        }
    },
    computed: {
        editorOptions() {
            return {
                theme: 'snow',
                placeholder: this.$t('enterDescription'),
                modules: {
                    toolbar: [
                        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'color': [] }, { 'background': [] }],
                        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                        [{ 'align': [] }],
                        ['link', 'image'],
                        ['clean']
                    ]
                }
            };
        },
        priorityLevel() {
            const map = { low: 1, normal: 2, high: 3 }
            return map[this.priority] || 1
        },
        complexityLevel() {
            const map = { simple: 1, normal: 2, complex: 3 }
            return map[this.complexity] || 1
        },
        formattedFiles() {
            return this.getFormattedFiles();
        },
        checklistChipBadge() {
            if (!this.checklistItems.length) {
                return '';
            }
            const completed = this.checklistItems.filter((item) => item.completed).length;
            return `${completed}/${this.checklistItems.length}`;
        },
        filesChipBadge() {
            const count = this.formattedFiles.length;
            return count > 0 ? String(count) : '';
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
        formattedDeadline() {
            if (!this.deadline) return 'Без крайнего срока';
            return dayjs(this.deadline).format('DD.MM.YYYY HH:mm');
        },
        quillEditorKey() {
            return this.editingItem?.id ?? 'new-task';
        },
    },
    mounted() {
        this.$nextTick(async () => {
            if (!this.$store.getters.taskStatuses?.length) {
                await this.$store.dispatch('loadTaskStatuses');
            }

            // Устанавливаем дефолтный дедлайн только при создании новой задачи
            if (!this.editingItem && !this.deadline) {
                this.deadline = this.getDefaultDeadline();
            }

            this.applyInitialDraft(this.initialDraft);
            this.saveInitialState();
        });

        // Закрытие календаря при клике вне его
        document.addEventListener('click', this.handleClickOutside);
    },
    beforeUnmount() {
        document.removeEventListener('click', this.handleClickOutside);
    },
    watch: {
        initialDraft: {
            handler(newDraft) {
                this.applyInitialDraft(newDraft);
            },
            deep: true,
            immediate: false,
        },
    },
    methods: {
        translateTaskStatus,
        applyInitialDraft(draft) {
            if (!draft || this.editingItem) {
                return;
            }
            this.title = draft.title ?? '';
            this.description = draft.description ?? '';
            this.deadline = draft.deadline || this.deadline || this.getDefaultDeadline();
            this.projectId = draft.projectId ?? null;
            this.selectedProject = draft.project ?? null;
            this.selectedExecutor = draft.executor ?? null;
            this.selectedSupervisor = draft.supervisor ?? draft.executor ?? this.$store.state.user;
            this.$emit('initial-draft-applied');
        },

        closeChecklistDialog() {
            this.checklistDialogOpen = false;
        },

        closeFilesDialog() {
            this.filesDialogOpen = false;
        },

        onSelectedProjectUpdate(project) {
            applyProjectSelection(this, project);
            if (!this.projectId) {
                this.openToProjectParticipants = false;
            }
        },

        getDefaultDeadline() {
            return getDefaultTaskDeadline(this.$store.getters.currentCompany);
        },

        clearForm() {
            this.title = '';
            this.description = '';
            this.statusId = 1;
            this.deadline = this.getDefaultDeadline();
            this.projectId = null;
            this.selectedProject = null;
            this.priority = 'low';
            this.complexity = 'normal';
            this.selectedSupervisor = this.$store.state.user;
            this.selectedExecutor = null;
            this.selectedObserverIds = [];
            this.openToProjectParticipants = false;
            this.pendingFiles = [];
            this.checklistItems = [];
            this.checklistDialogOpen = false;
            this.filesDialogOpen = false;
            this.resetFormChanges();
        },
        getFormState() {
            return {
                title: this.title,
                description: this.description,
                statusId: this.statusId,
                deadline: this.deadline,
                projectId: this.projectId,
                supervisorId: this.supervisorId,
                executorId: this.executorId,
                selectedObserverIds: this.selectedObserverIds,
                openToProjectParticipants: this.openToProjectParticipants,
                priority: this.priority,
                complexity: this.complexity,
                checklistItems: this.checklistItems,
            };
        },
        onEditingItemChanged(newEditingItem) {
            const newItemId = newEditingItem?.id ?? null;
            if (newItemId != null && newItemId === this._lastEditingItemId) {
                return;
            }
            this._lastEditingItemId = newItemId;
            if (newEditingItem) {
                this.title = newEditingItem.title ?? '';
                this.description = newEditingItem.description ?? '';
                this.statusId = newEditingItem.statusId ?? newEditingItem.status?.id ?? null;
                this.deadline = newEditingItem.deadline ? this.getFormattedDate(newEditingItem.deadline) : null;
                this.projectId = newEditingItem.project?.id ?? newEditingItem.projectId ?? null;
                this.selectedProject = newEditingItem.project ?? null;
                this.selectedSupervisor = resolveTaskSupervisor(newEditingItem, this.$store.state.user);
                this.selectedExecutor = resolveTaskExecutor(newEditingItem);
                this.selectedObserverIds = resolveObserverIds(newEditingItem);
                this.openToProjectParticipants = newEditingItem.restrictVisibility === false;
                this.priority = newEditingItem.priority || 'low';
                this.complexity = newEditingItem.complexity || 'normal';
                this.checklistItems = parseTaskChecklist(newEditingItem.checklist);
            }
        },
        handleDateChange(value) {
            if (!value) {
                this.deadline = null;
                this.showDatePicker = false;
                return;
            }

            const selectedDate = dayjs(value);
            const workSchedule = buildEffectiveWorkSchedule(
                this.$store.getters.currentCompany?.workSchedule,
            );
            let finalValue;

            const scheduleDayKey = getScheduleDayKeyFromDayjsDay(selectedDate.day());
            const daySchedule = workSchedule[scheduleDayKey];

            if (daySchedule?.end) {
                const [endHour, endMinute] = daySchedule.end.split(':').map(Number);
                finalValue = selectedDate.hour(endHour).minute(endMinute).second(0).format('YYYY-MM-DDTHH:mm');
            } else {
                finalValue = value;
            }

            if (dayjs(finalValue).isBefore(dayjs()) && !window.confirm(this.$t('confirmPastDeadline'))) {
                return;
            }

            this.deadline = finalValue;
        },
        handleInputClick(event) {
            event.stopPropagation();
            this.showDatePicker = true;
        },
        clearDeadline() {
            this.deadline = null;
            this.showDatePicker = false;
        },
        handleClickOutside(event) {
            if (!this.showDatePicker) {
                return;
            }

            const inputWrapper = this.$refs.dateInputWrapper;
            const datePickerWrapper = this.$refs.datePickerWrapper;

            if (inputWrapper && datePickerWrapper &&
                !inputWrapper.contains(event.target) &&
                !datePickerWrapper.contains(event.target)) {
                this.showDatePicker = false;
            }
        },
        getFormattedFiles() {
            // Если задача уже создана, используем файлы из editingItem
            if (this.editingItem && this.editingItem.files) {
                // Если editingItem уже является TaskDto, используем его метод напрямую
                const formattedFiles = this.editingItem.getFormattedFiles?.();
                if (formattedFiles) {
                    return formattedFiles;
                }

                // Иначе обрабатываем файлы напрямую
                return (this.editingItem.files || []).map((file) => ({
                    name: file.name || file.path,
                    url: file.path ? `/storage/${file.path}` : '#',
                    icon: this.getFileIcon(file),
                    path: file.path,
                    size: file.size,
                    mimeType: file.mimeType,
                    uploadedAt: file.uploadedAt,
                    formattedSize: this.formatFileSize(file.size),
                    formattedUploadDate: file.uploadedAt ? new Date(file.uploadedAt).toLocaleString() : ''
                }));
            }

            if (this.pendingFiles?.length) {
                return this.pendingFiles.map((file, index) => ({
                    name: file.name,
                    url: URL.createObjectURL(file),
                    icon: this.getFileIcon(file),
                    path: `pending_${index}`,
                    size: file.size,
                    mimeType: file.type,
                    uploadedAt: getCurrentServerDateObject().toISOString(),
                    formattedSize: this.formatFileSize(file.size),
                    formattedUploadDate: getCurrentServerDateObject().toLocaleString(),
                    isPending: true // Флаг для отличия pending файлов
                }));
            }

            return [];
        },
        getFileIcon(file) {
            const ext = (file.name).split('.').pop().toLowerCase();
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

        async performDelete() {
            return await TaskController.deleteItem(this.editingItemId);
        },
        onDeleteSuccess() {
            this.showNotification(
                this.$t('success'),
                this.$t('taskSuccessfullyDeleted'),
                false
            );
            this.$emit('deleted', this.editingItemId);
        },
        onDeleteError(error) {
            const errorMessage = this.getApiErrorMessage(error);
            this.showNotification(
                this.$t('error'),
                errorMessage,
                true
            );
        },
        async handleFileChange(files) {
            if (!files?.length) return;

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

                if (this.editingItem) {
                    this.$emit('update:editingItem', { ...this.editingItem, files: uploadedFiles });
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
                const index = parseInt(filePath.replace('pending_', ''), 10);
                this.pendingFiles.splice(index, 1);
                return;
            }

            // Если задача уже создана, показываем диалог удаления
            if (!this.editingItemId) return;

            this.deleteFileIndex = filePath;
            this.deleteFileDialog = true;
        },
        showDeleteMultipleFilesDialog(selectedFileIds) {
            if (!selectedFileIds?.length) return;

            // Фильтруем pending файлы
            const pendingIndices = selectedFileIds
                .filter(id => id.startsWith('pending_'))
                .map(id => parseInt(id.replace('pending_', ''), 10))
                .sort((a, b) => b - a); // Сортируем по убыванию для правильного удаления

            // Удаляем pending файлы
            pendingIndices.forEach(index => {
                this.pendingFiles.splice(index, 1);
            });

            const remainingIds = selectedFileIds.filter(id => !id.startsWith('pending_'));
            if (remainingIds?.length && this.editingItemId) {
                this.selectedFileIds = remainingIds;
                this.deleteFileIndex = 'multiple';
                this.deleteFileDialog = true;
            } else if (this.$refs.fileUploader) {
                this.$refs.fileUploader.selectedFileIds = [];
            }
        },
        async save() {
            if (this.uploading) {
                alert(this.$t('waitForFileUpload'));
                return;
            }

            if (!this.title || this.title.trim() === '') {
                this.showNotification(
                    this.$t('error'),
                    this.$t('titleRequired'),
                    true
                );
                return;
            }

            if (!this.supervisorId) {
                this.showNotification(
                    this.$t('error'),
                    this.$t('supervisorRequired'),
                    true
                );
                return;
            }

            if (!this.executorId) {
                this.showNotification(
                    this.$t('error'),
                    this.$t('executorRequired'),
                    true
                );
                return;
            }

            return crudFormMixin.methods.save.call(this);
        },
        prepareSave() {
            return {
                title: this.title.trim(),
                description: this.description || null,
                statusId: this.statusId || null,
                deadline: this.deadline ? dayjs(this.deadline).format('YYYY-MM-DD HH:mm:ss') : null,
                projectId: this.projectId || null,
                supervisorId: this.supervisorId,
                executorId: this.executorId,
                observerIds: this.selectedObserverIds || [],
                restrictVisibility: this.projectId ? !this.openToProjectParticipants : true,
                priority: this.priority || 'low',
                complexity: this.complexity || 'normal',
                checklist: this.checklistItems || [],
            };
        },
        async performSave(data) {
            let response;
            if (this.editingItemId) {
                response = await TaskController.updateItem(this.editingItemId, data);

                try {
                    const updatedTask = await TaskController.getItem(this.editingItemId);

                    if (updatedTask) {
                        response.data = updatedTask;
                    }
                } catch (error) {
                    console.error('Ошибка при получении обновленной задачи:', error);
                }
            } else {
                response = await TaskController.createItem(data);
                this.editingItemId = response.data.id;

                if (this.pendingFiles?.length) {
                    try {
                        await TaskController.uploadFiles(this.editingItemId, this.pendingFiles);
                        this.pendingFiles = [];

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

            return response.data;
        },
        onSaveSuccess(response) {
            if (response) {
                this.$emit('update:editingItem', response);
            }

            this.showNotification(
                this.$t('success'),
                this.editingItemId ? this.$t('taskSuccessfullyUpdated') : this.$t('taskSuccessfullyAdded'),
                false
            );

            this.saveInitialState();
        },
        onSaveError(error) {
            const errorMessage = this.getApiErrorMessage(error);
            this.showNotification(
                this.$t('error'),
                errorMessage,
                true
            );
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
                    this.$emit('update:editingItem', updatedTask);
                } else if (this.editingItem && updatedFiles) {
                    this.$emit('update:editingItem', { ...this.editingItem, files: updatedFiles });
                }

                this.showNotification(
                    this.$t('success'),
                    this.$t('fileDeletedSuccessfully'),
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

    },
}
</script>
