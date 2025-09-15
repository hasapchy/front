<template>
    <div class="flex justify-between items-center mb-4">
        <div class="flex items-center flex-wrap gap-2">
            <PrimaryButton :onclick="() => { showModal(null) }" icon="fas fa-plus">{{ $t('addProject') }}</PrimaryButton>
            
            <!-- Фильтр по статусу -->
            <div class="ml-2">
                <select v-model="statusFilter" @change="() => fetchItems()" class="w-full p-2 pl-10 border rounded">
                    <option value="">{{ $t('allStatuses') }}</option>
                    <option v-for="status in statuses" :key="status.id" :value="status.id">
                        {{ status.name }}
                    </option>
                </select>
            </div>
            
            <!-- Фильтр по клиенту -->
            <div class="ml-2 relative">
                <div v-if="selectedClient == null" class="relative">
                    <input type="text" v-model="clientSearch" :placeholder="$t('enterClientNameOrNumber')"
                        class="w-full p-2 border rounded" @focus="showClientDropdown = true" @blur="handleClientBlur" />
                    <transition name="appear">
                        <ul v-show="showClientDropdown"
                            class="absolute bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto w-96 mt-1 z-10">
                            <li v-if="clientSearchLoading" class="p-2 text-gray-500">{{ $t('loading') }}</li>
                            <template v-else-if="clientSearch.length === 0">
                                <li v-for="client in lastClients" :key="client.id" @mousedown.prevent="selectClient(client)"
                                    class="cursor-pointer p-2 border-b-gray-300 hover:bg-gray-100">
                                    <div class="flex justify-between">
                                        <div><span v-html="client.icons()"></span> {{ client.fullName() }}</div>
                                        <div class="text-[#337AB7]">{{ client.phones[0]?.phone }}</div>
                                    </div>
                                </li>
                            </template>
                            <li v-else-if="clientSearch.length < 3" class="p-2 text-gray-500">{{ $t('minimum3Characters') }}</li>
                            <li v-else-if="clientResults.length === 0" class="p-2 text-gray-500">{{ $t('notFound') }}</li>
                            <li v-for="client in clientResults" :key="client.id" @mousedown.prevent="() => selectClient(client)"
                                class="cursor-pointer p-2 border-b-gray-300 hover:bg-gray-100">
                                <div class="flex justify-between">
                                    <div><span v-html="client.icons()"></span> {{ client.fullName() }}</div>
                                    <div class="text-[#337AB7]">{{ client.phones[0]?.phone }}</div>
                                </div>
                            </li>
                        </ul>
                    </transition>
                </div>
                <div v-else class="relative">
                    <input type="text" :value="selectedClient.fullName()" readonly
                        class="w-full p-2 border rounded bg-gray-50" />
                    <button @click="deselectClient" class="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-500 text-lg cursor-pointer">×</button>
                </div>
            </div>
            
        </div>
        <Pagination v-if="data != null" :currentPage="data.currentPage" :lastPage="data.lastPage"
            @changePage="fetchItems" />
    </div>
    <BatchButton v-if="selectedIds.length" :selected-ids="selectedIds" :batch-actions="getBatchActions()" />
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
import ClientController from '@/api/ClientController';
import ProjectCreatePage from '@/views/pages/projects/ProjectCreatePage.vue';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import BatchButton from '@/views/components/app/buttons/BatchButton.vue';
import batchActionsMixin from '@/mixins/batchActionsMixin';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import tableTranslationMixin from '@/mixins/tableTranslationMixin';
import StatusSelectCell from '@/views/components/app/buttons/StatusSelectCell.vue';
import { markRaw } from 'vue';
import debounce from 'lodash.debounce';

export default {
    mixins: [modalMixin, notificationMixin, crudEventMixin, batchActionsMixin, getApiErrorMessageMixin, tableTranslationMixin],
    components: { NotificationToast, PrimaryButton, SideModalDialog, Pagination, DraggableTable, ProjectCreatePage, BatchButton, AlertDialog, StatusSelectCell },
    data() {
        return {
            data: null,
            loading: false,
            selectedIds: [],
            statusFilter: '',
            statuses: [],
            clientFilter: '',
            clients: [],
            // Новые данные для поиска клиентов
            selectedClient: null,
            clientSearch: '',
            clientSearchLoading: false,
            clientResults: [],
            lastClients: [],
            showClientDropdown: false,
            controller: ProjectController,
            savedSuccessText: this.$t('projectSuccessfullyAdded'),
            savedErrorText: this.$t('errorSavingProject'),
            deletedSuccessText: this.$t('projectSuccessfullyDeleted'),
            deletedErrorText: this.$t('errorDeletingProject'),
        }
    },
    created() {
        this.$store.commit('SET_SETTINGS_OPEN', false);
    },

    mounted() {
        this.fetchProjectStatuses();
        this.fetchClients();
        this.fetchLastClients();
        this.fetchItems();
    },
    methods: {
        itemMapper(i, c) {
            switch (c) {
                case 'clientId':
                    return i.clientId != null && i.client ? i.client.fullName() : this.$t('notSpecified');
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
                this.statuses = await ProjectStatusController.getAllItems();
            } catch (error) {
                console.error('Error fetching project statuses:', error);
            }
        },
        async fetchClients() {
            try {
                this.clients = await ClientController.getAllItems();
            } catch (error) {
                console.error('Error fetching clients:', error);
            }
        },
        async fetchLastClients() {
            try {
                const paginated = await ClientController.getItems(1, null, false);
                this.lastClients = paginated.items.slice(0, 10);
            } catch (error) {
                console.error('Error fetching last clients:', error);
            }
        },
        searchClients: debounce(async function () {
            if (this.clientSearch.length >= 3) {
                this.clientSearchLoading = true;
                try {
                    const results = await ClientController.search(this.clientSearch);
                    this.clientResults = results;
                } catch (error) {
                    console.error('Search error:', error);
                    this.clientResults = [];
                } finally {
                    this.clientSearchLoading = false;
                }
            } else {
                this.clientResults = [];
            }
        }, 250),
        async selectClient(client) {
            this.showClientDropdown = false;
            this.clientSearch = '';
            this.clientResults = [];
            this.selectedClient = client;
            this.clientFilter = client.id;
            this.fetchItems();
        },
        deselectClient() {
            this.selectedClient = null;
            this.clientFilter = '';
            this.fetchItems();
        },
        handleClientBlur() {
            requestAnimationFrame(() => {
                this.showClientDropdown = false;
            });
        },
        async fetchItems(page = 1, silent = false) {
            if (!silent) {
                this.loading = true;
            }
            try {
                const filters = {};
                if (this.statusFilter) filters.status_id = this.statusFilter;
                if (this.clientFilter) filters.client_id = this.clientFilter;
                
                const new_data = await ProjectController.getItems(page, filters);
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
        }
    },
    watch: {
        clientSearch: {
            handler: 'searchClients',
            immediate: true,
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
                { name: 'clientId', label: 'client' },
                { name: 'users', label: 'access' },
            ];
        }
    },
}
</script>

<style scoped>
.appear-enter-active,
.appear-leave-active {
    transition: transform 0.2s ease, opacity 0.2s ease;
}

.appear-enter-from,
.appear-leave-to {
    transform: scaleY(0);
    opacity: 0;
    transform-origin: top;
}

.appear-enter-to,
.appear-leave-from {
    transform: scaleY(1);
    opacity: 1;
    transform-origin: top;
}
</style>
