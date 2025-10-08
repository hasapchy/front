<template>
    <div class="flex justify-between items-center mb-4">
        <div class="flex items-center flex-wrap gap-2">
            <PrimaryButton 
                :onclick="() => { showModal(null) }" 
                icon="fas fa-plus"
                :disabled="!$store.getters.hasPermission('projects_create')">
            </PrimaryButton>
            
            <!-- Фильтр по статусу -->
            <div class="ml-2">
                <select v-model="statusFilter" @change="debouncedFetchItems" class="w-full p-2 pl-10 border rounded">
                    <option value="">{{ $t('allStatuses') }}</option>
                    <option v-for="status in statuses" :key="status.id" :value="status.id">
                        {{ status.name }}
                    </option>
                </select>
            </div>
            
            <!-- Фильтр по клиенту -->
            <div class="ml-2">
                <select v-model="clientFilter" @change="debouncedFetchItems" class="w-full p-2 pl-10 border rounded">
                    <option value="">{{ $t('allClients') }}</option>
                    <option v-for="client in clients" :key="client.id" :value="client.id">
                        {{ client.first_name }} {{ client.last_name || client.contact_person }}
                    </option>
                </select>
            </div>
            
        </div>
        <Pagination v-if="data != null" :currentPage="data.currentPage" :lastPage="data.lastPage"
            :per-page="perPage" :per-page-options="perPageOptions" :show-per-page-selector="true"
            storage-key="projectsPerPage"
            @changePage="fetchItems" @perPageChange="handlePerPageChange" />
    </div>
    <BatchButton v-if="selectedIds.length" :selected-ids="selectedIds" :batch-actions="getBatchActions()"
        :statuses="statuses" :handle-change-status="handleChangeStatus" :show-status-select="true" />
    <transition name="fade" mode="out-in">
        <div v-if="data != null && !loading" :key="`table-${$i18n.locale}`">
            <DraggableTable table-key="admin.projects" :columns-config="translatedColumnsConfig" :table-data="data.items"
                :item-mapper="itemMapper" @selectionChange="selectedIds = $event"
                :onItemClick="(i) => { showModal(i) }" />
        </div>
        <div v-else key="loader" class="flex justify-center items-center h-64">
            <i class="fas fa-spinner fa-spin text-2xl"></i><br>
        </div>
    </transition>
    <SideModalDialog :showForm="modalDialog" :onclose="handleModalClose">
        <ProjectCreatePage ref="projectcreatepageForm" @saved="handleSaved" @saved-error="handleSavedError" @deleted="handleDeleted"
            @deleted-error="handleDeletedError" @close-request="closeModal" :editingItem="editingItem" />
    </SideModalDialog>
    <NotificationToast :title="notificationTitle" :subtitle="notificationSubtitle" :show="notification"
        :is-danger="notificationIsDanger" @close="closeNotification" />
            <AlertDialog :dialog="deleteDialog" :descr="`${$t('confirmDeleteSelected')} (${selectedIds.length})?`" :confirm-text="$t('deleteSelected')"
                  :leave-text="$t('cancel')" @confirm="confirmDeleteItems" @leave="deleteDialog = false" />
</template>

<script>
import NotificationToast from '@/views/components/app/dialog/NotificationToast.vue';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import Pagination from '@/views/components/app/buttons/Pagination.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import ProjectController from '@/api/ProjectController';
import ProjectStatusController from '@/api/ProjectStatusController';
import ProjectCreatePage from '@/views/pages/projects/ProjectCreatePage.vue';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import BatchButton from '@/views/components/app/buttons/BatchButton.vue';
import batchActionsMixin from '@/mixins/batchActionsMixin';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import tableTranslationMixin from '@/mixins/tableTranslationMixin';
import companyChangeMixin from '@/mixins/companyChangeMixin';
import StatusSelectCell from '@/views/components/app/buttons/StatusSelectCell.vue';
import ClientButtonCell from '@/views/components/app/buttons/ClientButtonCell.vue';
import { markRaw } from 'vue';

export default {
    mixins: [modalMixin, notificationMixin, crudEventMixin, batchActionsMixin, getApiErrorMessageMixin, companyChangeMixin, tableTranslationMixin],
    components: { NotificationToast, PrimaryButton, SideModalDialog, Pagination, DraggableTable, ProjectCreatePage, BatchButton, AlertDialog, StatusSelectCell, ClientButtonCell },
    data() {
        return {
            data: null,
            loading: false,
            selectedIds: [],
            statusFilter: '',
            statuses: [],
            clientFilter: '',
            clients: [],
            controller: ProjectController,
            savedSuccessText: this.$t('projectSuccessfullyAdded'),
            savedErrorText: this.$t('errorSavingProject'),
            deletedSuccessText: this.$t('projectSuccessfullyDeleted'),
            deletedErrorText: this.$t('errorDeletingProject'),
            perPage: 10,
            perPageOptions: [10, 25, 50, 100],
            debounceTimer: null
        }
    },
    created() {
        this.$store.commit('SET_SETTINGS_OPEN', false);
    },

    async mounted() {
        // Загружаем статусы первыми, чтобы они были доступны при создании проекта
        await this.fetchProjectStatuses();
        await this.fetchClients();
        this.fetchItems();
    },
    beforeUnmount() {
        // Очищаем таймер при уничтожении компонента
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
    },
    methods: {
        itemMapper(i, c) {
            switch (c) {
                case 'users':
                    return (i.users || '').length + ' ' + this.$t('users');
                case 'createdAt':
                    return i.formatCreatedAt();
                case 'dateUser':
                    return `${i.formatDate()} / ${i.creator?.name || this.$t('notSpecified')}`;
                case 'description':
                    return i.description || 'Не указано';
                default:
                    return i[c];
            }
        },
        handleModalClose() {
            const formRef = this.$refs.projectcreatepageForm;
            if (formRef && formRef.handleCloseRequest) {
                formRef.handleCloseRequest();
            } else {
                this.closeModal();
            }
        },
        async fetchProjectStatuses() {
            try {
                // Используем данные из store
                await this.$store.dispatch('loadProjectStatuses');
                this.statuses = this.$store.getters.projectStatuses;
            } catch (error) {
                console.error('Error fetching project statuses:', error);
            }
        },
        async fetchClients() {
            try {
                // Используем данные из store
                await this.$store.dispatch('loadClients');
                this.clients = this.$store.getters.clients;
            } catch (error) {
                console.error('Error fetching clients:', error);
            }
        },
        handlePerPageChange(newPerPage) {
            this.perPage = newPerPage;
            this.fetchItems(1, false);
        },
        debouncedFetchItems() {
            // Очищаем предыдущий таймер
            if (this.debounceTimer) {
                clearTimeout(this.debounceTimer);
            }
            // Устанавливаем новый таймер на 300ms
            this.debounceTimer = setTimeout(() => {
                this.fetchItems();
            }, 300);
        },
        async fetchItems(page = 1, silent = false) {
            if (!silent) {
                this.loading = true;
            }
            try {
                const filters = {};
                if (this.statusFilter) filters.status_id = this.statusFilter;
                if (this.clientFilter) filters.client_id = this.clientFilter;
                
                const new_data = await ProjectController.getItems(page, filters, this.perPage);
                this.data = new_data;
            } catch (error) {
                this.showNotification(this.$t('errorGettingProjectList'), error.message, true);
            }
            if (!silent) {
                this.loading = false;
            }
        },
        async handleChangeStatus(ids, statusId) {
            if (!ids.length) return;
            this.loading = true;
            try {
                await ProjectController.batchUpdateStatus({ ids, status_id: statusId });
                await this.fetchItems(this.data.currentPage, true);
                this.showNotification(this.$t('statusUpdated'), "", false);
                this.selectedIds = []; // Очищаем выбранные элементы
            } catch (error) {
                this.showNotification(this.$t('errorUpdatingStatus'), this.getApiErrorMessage(error), true);
            }
            this.loading = false;
        },
        handleDateFilterChange() {
            if (this.dateFilter !== 'custom') {
                this.startDate = null;
                this.endDate = null;
            }
            this.fetchItems();
        },
        // Переопределяем метод из modalMixin для добавления специфичной логики
        showModal(item = null) {
            this.modalDialog = true;
            this.showTimeline = true;
            this.editingItem = item;
        },
        // Переопределяем метод из crudEventMixin для добавления специфичной логики
        async handleSaved() {
            this.showNotification(this.savedSuccessText, "", false);
            this.closeModal();
            
            // Обновляем список
            this.fetchItems();
        },
        // Переопределяем метод из crudEventMixin для добавления специфичной логики
        async handleDeleted() {
            // После удаления проекта обновляем список
            this.fetchItems();
            this.showNotification(this.deletedSuccessText, "", false);
            this.closeModal();
        },
    },
    computed: {
        columnsConfig() {
            return [
                { name: 'select', label: '#', size: 15 },
                { name: 'id', label: 'number', size: 60 },
                { name: 'name', label: 'name' },
                { name: "statusName", label: 'projectStatus', component: markRaw(StatusSelectCell), props: (i) => ({ id: i.id, value: i.statusId, statuses: this.statuses, onChange: (newStatusId) => this.handleChangeStatus([i.id], newStatusId), }), },
                { name: 'dateUser', label: 'dateUser' },
                {
                    name: 'client',
                    label: 'client',
                    component: markRaw(ClientButtonCell),
                    props: (item) => ({
                        client: item.client,
                    })
                },
                { name: 'users', label: 'access' },
            ];
        }
    },
}
</script>
