<template>
    <BatchButton v-if="selectedIds.length && viewMode === 'table'" :selected-ids="selectedIds" :batch-actions="getBatchActions()"
        :show-batch-status-select="showBatchStatusSelect" :statuses="statuses"
        :handle-change-status="handleChangeStatus" :show-status-select="true" />
    
    <transition name="fade" mode="out-in">
        <div v-if="data && !loading && viewMode === 'table'" :key="`table-${$i18n.locale}`">
            <DraggableTable table-key="admin.orders" :columns-config="columnsConfig" :table-data="data.items"
                :item-mapper="itemMapper" :onItemClick="(i) => showModal(i)" @selectionChange="selectedIds = $event">
                <template #tableControlsBar="{ resetColumns, columns, toggleVisible, log }">
                    <TableControlsBar
                        :show-filters="true"
                        :has-active-filters="hasActiveFilters"
                        :active-filters-count="getActiveFiltersCount()"
                        :on-filters-reset="resetFilters"
                        :show-pagination="true"
                        :pagination-data="data ? { currentPage: data.currentPage, lastPage: data.lastPage, perPage: perPage, perPageOptions: perPageOptions } : null"
                        :on-page-change="fetchItems"
                        :on-per-page-change="handlePerPageChange"
                        :resetColumns="resetColumns"
                        :columns="columns"
                        :toggleVisible="toggleVisible"
                        :log="log">
                        <template #left>
                            <PrimaryButton 
                                :onclick="() => showModal(null)" 
                                icon="fas fa-plus"
                                :disabled="!$store.getters.hasPermission('orders_create')">
                            </PrimaryButton>
                            
                            <FiltersContainer 
                                :has-active-filters="hasActiveFilters"
                                :active-filters-count="getActiveFiltersCount()"
                                @reset="resetFilters">
                                <div>
                                    <label class="block mb-2 text-xs font-semibold">{{ $t('dateFilter') || 'Период' }}</label>
                                    <select v-model="dateFilter" @change="() => fetchItems(1)" class="w-full">
                                        <option value="all_time">{{ $t('allTime') }}</option>
                                        <option value="today">{{ $t('today') }}</option>
                                        <option value="yesterday">{{ $t('yesterday') }}</option>
                                        <option value="this_week">{{ $t('thisWeek') }}</option>
                                        <option value="this_month">{{ $t('thisMonth') }}</option>
                                        <option value="last_week">{{ $t('lastWeek') }}</option>
                                        <option value="last_month">{{ $t('lastMonth') }}</option>
                                        <option value="custom">{{ $t('selectDates') }}</option>
                                    </select>
                                </div>

                                <div v-if="dateFilter === 'custom'" class="space-y-2">
                                    <div>
                                        <label class="block mb-2 text-xs font-semibold">{{ $t('startDate') || 'Начальная дата' }}</label>
                                        <input type="date" v-model="startDate" @change="() => fetchItems(1)" class="w-full" />
                                    </div>
                                    <div>
                                        <label class="block mb-2 text-xs font-semibold">{{ $t('endDate') || 'Конечная дата' }}</label>
                                        <input type="date" v-model="endDate" @change="() => fetchItems(1)" class="w-full" />
                                    </div>
                                </div>

                                <div>
                                    <label class="block mb-2 text-xs font-semibold">{{ $t('status') || 'Статус' }}</label>
                                    <select v-model="statusFilter" @change="() => fetchItems(1)" class="w-full">
                                        <option value="">{{ $t('allStatuses') }}</option>
                                        <option v-for="status in statuses" :key="status.id" :value="status.id">
                                            {{ status.name }}
                                        </option>
                                    </select>
                                </div>

                                <div>
                                    <label class="block mb-2 text-xs font-semibold">{{ $t('project') || 'Проект' }}</label>
                                    <select v-model="projectFilter" @change="() => fetchItems(1)" class="w-full">
                                        <option value="">{{ $t('allProjects') }}</option>
                                        <option v-for="project in projects" :key="project.id" :value="project.id">
                                            {{ project.name }}
                                        </option>
                                    </select>
                                </div>

                                <div>
                                    <label class="block mb-2 text-xs font-semibold">{{ $t('client') || 'Клиент' }}</label>
                                    <select v-model="clientFilter" @change="() => fetchItems(1)" class="w-full">
                                        <option value="">{{ $t('allClients') }}</option>
                                        <option v-for="client in clients" :key="client.id" :value="client.id">
                                            {{ client.fullName() }}
                                        </option>
                                    </select>
                                </div>
                            </FiltersContainer>

                            <div class="flex items-center border border-gray-300 rounded overflow-hidden">
                                <button 
                                    @click="changeViewMode('table')"
                                    class="px-3 py-2 transition-colors cursor-pointer"
                                    :class="viewMode === 'table' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'">
                                    <i class="fas fa-table"></i>
                                </button>
                                <button 
                                    @click="changeViewMode('kanban')"
                                    class="px-3 py-2 transition-colors cursor-pointer"
                                    :class="viewMode === 'kanban' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'">
                                    <i class="fas fa-columns"></i>
                                </button>
                            </div>
                        </template>

                        <template #right>
                            <OrderPaymentFilter 
                                v-model="paidOrdersFilter"
                                :orders="data ? data.items : []"
                                :statusId="4"
                                :currencySymbol="currencySymbol"
                                :unpaidOrdersTotal="unpaidOrdersTotal"
                                @change="handlePaidOrdersFilterChange"
                            />
                            <Pagination v-if="data != null" :currentPage="data.currentPage" :lastPage="data.lastPage"
                                :per-page="perPage" :per-page-options="perPageOptions" :show-per-page-selector="true"
                                @changePage="fetchItems" @perPageChange="handlePerPageChange" />
                        </template>

                        <template #gear="{ resetColumns, columns, toggleVisible, log }">
                            <TableFilterButton v-if="columns && columns.length" :onReset="resetColumns">
                                <ul>
                                    <draggable v-if="columns.length" class="dragArea list-group w-full" :list="columns"
                                        @change="log">
                                        <li v-for="(element, index) in columns" :key="element.name"
                                            @click="toggleVisible(index)"
                                            class="flex items-center hover:bg-gray-100 p-2 rounded">
                                            <div class="space-x-2 flex flex-row justify-between w-full select-none">
                                                <div>
                                                    <i class="text-sm mr-2 text-[#337AB7]"
                                                        :class="[element.visible ? 'fas fa-circle-check' : 'far fa-circle']"></i>
                                                    {{ $te(element.label) ? $t(element.label) : element.label }}
                                                </div>
                                                <div><i
                                                        class="fas fa-grip-vertical text-gray-300 text-sm cursor-grab"></i>
                                                </div>
                                            </div>
                                        </li>
                                    </draggable>
                                </ul>
                            </TableFilterButton>
                        </template>
                    </TableControlsBar>
                </template>
            </DraggableTable>
        </div>

        <div v-else-if="data && viewMode === 'kanban'" key="kanban-view" class="kanban-view-container">
            <TableControlsBar
                :show-filters="true"
                :has-active-filters="hasActiveFilters"
                :active-filters-count="getActiveFiltersCount()"
                :on-filters-reset="resetFilters"
                :show-pagination="false">
                <template #left>
                    <PrimaryButton 
                        :onclick="() => showModal(null)" 
                        icon="fas fa-plus"
                        :disabled="!$store.getters.hasPermission('orders_create')">
                    </PrimaryButton>
                    
                    <FiltersContainer 
                        :has-active-filters="hasActiveFilters"
                        :active-filters-count="getActiveFiltersCount()"
                        @reset="resetFilters">
                        <div>
                            <label class="block mb-2 text-xs font-semibold">{{ $t('dateFilter') || 'Период' }}</label>
                            <select v-model="dateFilter" @change="() => fetchItems(1)" class="w-full">
                                <option value="all_time">{{ $t('allTime') }}</option>
                                <option value="today">{{ $t('today') }}</option>
                                <option value="yesterday">{{ $t('yesterday') }}</option>
                                <option value="this_week">{{ $t('thisWeek') }}</option>
                                <option value="this_month">{{ $t('thisMonth') }}</option>
                                <option value="last_week">{{ $t('lastWeek') }}</option>
                                <option value="last_month">{{ $t('lastMonth') }}</option>
                                <option value="custom">{{ $t('selectDates') }}</option>
                            </select>
                        </div>

                        <div v-if="dateFilter === 'custom'" class="space-y-2">
                            <div>
                                <label class="block mb-2 text-xs font-semibold">{{ $t('startDate') || 'Начальная дата' }}</label>
                                <input type="date" v-model="startDate" @change="() => fetchItems(1)" class="w-full" />
                            </div>
                            <div>
                                <label class="block mb-2 text-xs font-semibold">{{ $t('endDate') || 'Конечная дата' }}</label>
                                <input type="date" v-model="endDate" @change="() => fetchItems(1)" class="w-full" />
                            </div>
                        </div>

                        <div>
                            <label class="block mb-2 text-xs font-semibold">{{ $t('status') || 'Статус' }}</label>
                            <select v-model="statusFilter" @change="() => fetchItems(1)" class="w-full">
                                <option value="">{{ $t('allStatuses') }}</option>
                                <option v-for="status in statuses" :key="status.id" :value="status.id">
                                    {{ status.name }}
                                </option>
                            </select>
                        </div>

                        <div>
                            <label class="block mb-2 text-xs font-semibold">{{ $t('project') || 'Проект' }}</label>
                            <select v-model="projectFilter" @change="() => fetchItems(1)" class="w-full">
                                <option value="">{{ $t('allProjects') }}</option>
                                <option v-for="project in projects" :key="project.id" :value="project.id">
                                    {{ project.name }}
                                </option>
                            </select>
                        </div>

                        <div>
                            <label class="block mb-2 text-xs font-semibold">{{ $t('client') || 'Клиент' }}</label>
                            <select v-model="clientFilter" @change="() => fetchItems(1)" class="w-full">
                                <option value="">{{ $t('allClients') }}</option>
                                <option v-for="client in clients" :key="client.id" :value="client.id">
                                    {{ client.fullName() }}
                                </option>
                            </select>
                        </div>
                    </FiltersContainer>

                    <div class="flex items-center border border-gray-300 rounded overflow-hidden">
                        <button 
                            @click="changeViewMode('table')"
                            class="px-3 py-2 transition-colors cursor-pointer"
                            :class="viewMode === 'table' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'">
                            <i class="fas fa-table"></i>
                        </button>
                        <button 
                            @click="changeViewMode('kanban')"
                            class="px-3 py-2 transition-colors cursor-pointer"
                            :class="viewMode === 'kanban' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'">
                            <i class="fas fa-columns"></i>
                        </button>
                    </div>
                </template>
                <template #right>
                    <OrderPaymentFilter 
                        v-model="paidOrdersFilter"
                        :orders="data ? data.items : []"
                        :statusId="4"
                        :currencySymbol="currencySymbol"
                        :unpaidOrdersTotal="unpaidOrdersTotal"
                        @change="handlePaidOrdersFilterChange"
                    />
                </template>
            </TableControlsBar>
            
            <KanbanBoard
                :orders="allKanbanItems"
                :statuses="statuses"
                :projects="projects"
                :selected-ids="selectedIds"
                :loading="loading"
                :currency-symbol="currencySymbol"
                :batch-status-id="batchStatusId"
                @order-moved="handleOrderMoved"
                @card-dblclick="showModal"
                @card-select-toggle="toggleSelectRow"
                @column-select-toggle="handleColumnSelectToggle"
                @batch-status-change="handleBatchStatusChangeFromToolbar"
                @batch-delete="() => deleteItems(selectedIds)"
                @clear-selection="() => selectedIds = []"
            />
        </div>

        <div v-else key="loader" class="flex justify-center items-center h-64">
            <SpinnerIcon />
        </div>
    </transition>

    <SideModalDialog :showForm="modalDialog" :onclose="handleModalClose" :timelineCollapsed="timelineCollapsed" 
        :showTimelineButton="!!editingItem" @toggle-timeline="toggleTimeline">
        <OrderCreatePage v-if="modalDialog" ref="ordercreatepageForm" @saved="handleSaved" @saved-silent="handleSavedSilent" @saved-error="handleSavedError"
            @deleted="handleDeleted" @deleted-error="handleDeletedError" @close-request="closeModal" :editingItem="editingItem" />

        <template #timeline>
            <TimelinePanel v-if="editingItem && !timelineCollapsed" ref="timelinePanel" :type="'order'" :id="editingItem.id" @toggle-timeline="toggleTimeline" @open-transaction="openTransactionFromTimeline" />
        </template>
    </SideModalDialog>

    <SideModalDialog :showForm="invoiceModalDialog" :onclose="handleInvoiceModalClose">
        <InvoiceCreatePage 
            v-if="invoiceModalDialog"
            ref="invoiceCreateForm" 
            @saved="handleInvoiceSaved" 
            @saved-error="handleInvoiceSavedError"
            @close-request="closeInvoiceModal" 
            :preselectedOrderIds="selectedIds"
        />
    </SideModalDialog>

    <SideModalDialog :showForm="viewTransactionModal" :onclose="() => { viewTransactionModal = false; editingTransactionItem = null; }">
        <TransactionCreatePage 
            v-if="viewTransactionModal"
            :editingItem="editingTransactionItem"
            @saved="handleTransactionViewSaved"
            @saved-error="handleTransactionSavedError"
            @deleted="handleTransactionViewDeleted"
            @deleted-error="handleTransactionSavedError"
            @close-request="() => { viewTransactionModal = false; editingTransactionItem = null; }"
        />
    </SideModalDialog>

    <SideModalDialog :showForm="transactionModal" :onclose="() => transactionModal = false">
        <TransactionCreatePage 
            v-if="editingTransaction"
            :editingItem="null"
            :initial-client="editingTransaction.client"
            :initial-project-id="editingTransaction.projectId"
            :order-id="editingTransaction.orderId"
            :default-cash-id="editingTransaction.cashId"
            :prefill-amount="editingTransaction.prefillAmount"
            :is-payment-modal="true"
            :form-config="orderTransactionFormConfig"
            @saved="handleTransactionSaved"
            @saved-error="handleTransactionSavedError"
            @close-request="() => transactionModal = false"
        />
    </SideModalDialog>

    <NotificationToast :title="notificationTitle" :subtitle="notificationSubtitle" :show="notification"
        :is-danger="notificationIsDanger" @close="closeNotification" />
            <AlertDialog :dialog="deleteDialog" :descr="`${$t('confirmDeleteSelected')} (${selectedIds.length})?`" :confirm-text="$t('deleteSelected')"
                  :leave-text="$t('cancel')" @confirm="confirmDeleteItems" @leave="deleteDialog = false" />
</template>

<script>
import NotificationToast from "@/views/components/app/dialog/NotificationToast.vue";
import SideModalDialog from "@/views/components/app/dialog/SideModalDialog.vue";
import PrimaryButton from "@/views/components/app/buttons/PrimaryButton.vue";
import FiltersContainer from '@/views/components/app/forms/FiltersContainer.vue';
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';
import Pagination from "@/views/components/app/buttons/Pagination.vue";
import DraggableTable from "@/views/components/app/forms/DraggableTable.vue";
import KanbanBoard from "@/views/components/app/kanban/KanbanBoard.vue";
import { VueDraggableNext } from 'vue-draggable-next';
import OrderController from "@/api/OrderController";
import OrderCreatePage from "@/views/pages/orders/OrderCreatePage.vue";
import InvoiceCreatePage from "@/views/pages/invoices/InvoiceCreatePage.vue";
import TransactionCreatePage from "@/views/pages/transactions/TransactionCreatePage.vue";
import TransactionController from "@/api/TransactionController";
import ClientButtonCell from "@/views/components/app/buttons/ClientButtonCell.vue";
import ProductsListCell from "@/views/components/app/buttons/ProductsListCell.vue";
import OrderStatusController from "@/api/OrderStatusController";
import ProjectController from "@/api/ProjectController";
import ClientController from "@/api/ClientController";
import { markRaw } from "vue";
import BatchButton from "@/views/components/app/buttons/BatchButton.vue";
import getApiErrorMessage from "@/mixins/getApiErrorMessageMixin";
import crudEventMixin from "@/mixins/crudEventMixin";
import notificationMixin from "@/mixins/notificationMixin";
import batchActionsMixin from "@/mixins/batchActionsMixin";
import modalMixin from "@/mixins/modalMixin";
import AlertDialog from "@/views/components/app/dialog/AlertDialog.vue";
import { defineAsyncComponent } from "vue";
import { eventBus } from "@/eventBus";
import OrderPaymentFilter from "@/views/components/app/forms/OrderPaymentFilter.vue";
import StatusSelectCell from "@/views/components/app/buttons/StatusSelectCell.vue";
import debounce from "lodash.debounce";
import companyChangeMixin from "@/mixins/companyChangeMixin";
import searchMixin from "@/mixins/searchMixin";
import { formatCurrency } from "@/utils/numberUtils";
import { highlightMatches } from "@/utils/searchUtils";
import SpinnerIcon from "@/views/components/app/SpinnerIcon.vue";
import { TRANSACTION_FORM_PRESETS } from "@/constants/transactionFormPresets";

const TimelinePanel = defineAsyncComponent(() => 
    import("@/views/components/app/dialog/TimelinePanel.vue")
);

export default {
    mixins: [getApiErrorMessage, crudEventMixin, notificationMixin, modalMixin, batchActionsMixin, companyChangeMixin, searchMixin],
    components: { NotificationToast, SideModalDialog, PrimaryButton, Pagination, DraggableTable, KanbanBoard, OrderCreatePage, InvoiceCreatePage, TransactionCreatePage, ClientButtonCell, OrderStatusController, BatchButton, AlertDialog, TimelinePanel, OrderPaymentFilter, StatusSelectCell, SpinnerIcon, FiltersContainer, TableControlsBar, TableFilterButton, draggable: VueDraggableNext },
    data() {
        return {
            viewMode: 'kanban',
            statuses: [],
            projects: [],
            clients: [],
            showBatchStatusSelect: false,
            timelineCollapsed: true,
            editingItem: null,
            invoiceModalDialog: false,
            loadingDelete: false,
            controller: OrderController,
            cacheInvalidationType: 'orders',
            savedSuccessText: this.$t('orderSaved'),
            savedErrorText: this.$t('errorSavingOrder'),
            deletedSuccessText: this.$t('orderDeleted'),
            deletedErrorText: this.$t('errorDeletingOrder'),
            columnsConfig: [
                { name: 'select', label: '#', size: 15 },
                { name: "id", label: "№", size: 20 },
                { name: "statusName", label: 'status', component: markRaw(StatusSelectCell), props: (i) => ({ id: i.id, value: i.statusId, statuses: this.statuses, onChange: (newStatusId) => this.handleChangeStatus([i.id], newStatusId) }), },
                { name: "cashName", label: 'cashRegister' },
                { name: "warehouseName", label: 'warehouse' },
                { name: "dateUser", label: 'dateUser' },
                { name: "client", label: 'client', component: markRaw(ClientButtonCell), props: (i) => ({ client: i.client, searchQuery: this.searchQuery }), },
                { name: "projectName", label: 'project' },
                {
                    name: "products",
                    label: 'products',
                    component: markRaw(ProductsListCell),
                    props: (item) => ({
                        products: item.products || []
                    })
                },
                { name: "note", label: 'note', html: true },
                { name: "description", label: 'description' },
                { name: "totalPrice", label: 'orderAmount' },
            ],
            dateFilter: 'all_time',
            startDate: null,
            endDate: null,
            statusFilter: '',
            projectFilter: '',
            clientFilter: '',
            paidOrdersFilter: false,
            unpaidOrdersTotal: 0,
            transactionModal: false,
            editingTransaction: null,
        viewTransactionModal: false,
        editingTransactionItem: null,
            savedCurrencySymbol: '',
            pendingStatusUpdates: new Map(),
            batchStatusId: '',
            allKanbanItems: [],
        };
    },
    created() {
        this.fetchStatuses();
        this.projects = this.$store.getters.projects || [];
        this.clients = this.$store.getters.clients || [];

        this.$store.commit("SET_SETTINGS_OPEN", false);
        eventBus.on('global-search', this.handleSearch);
    },

    beforeUnmount() {
        eventBus.off('global-search', this.handleSearch);
    },

    computed: {
        searchQuery() {
            return this.$store.state.searchQuery;
        },
        currencySymbol() {
            if (this.data && this.data.items && this.data.items.length > 0) {
                return this.data.items[0].currencySymbol || '';
            }
            return this.savedCurrencySymbol || '';
        },
        hasActiveFilters() {
            return this.dateFilter !== 'all_time' ||
                   (this.startDate !== null && this.startDate !== '') ||
                   (this.endDate !== null && this.endDate !== '') ||
                   this.statusFilter !== '' ||
                   this.projectFilter !== '' ||
                   this.clientFilter !== '' ||
                   this.paidOrdersFilter !== false;
        },
        orderTransactionFormConfig() {
            return TRANSACTION_FORM_PRESETS.orderPayment;
        }
    },
    watch: {
        '$store.state.clients'(newClients) {
            if (newClients && newClients.length > 0) {
                this.clients = newClients;
            }
        },
        '$store.state.projects'(newProjects) {
            if (newProjects && newProjects.length > 0) {
                this.projects = newProjects;
            }
        }
    },
    methods: {
        itemMapper(i, c) {
            const search = this.searchQuery;
            
            switch (c) {
                case "dateUser":
                    return `${i.formatDate()} / ${i.userName}`;
                case "products":
                    // Возвращаем количество продуктов для сортировки (отображение через компонент ProductsListCell)
                    return (i.products || []).length;
                case "client":
                    if (!i.client) return '<span class="text-gray-500">' + this.$t('notSpecified') + '</span>';
                    const name = i.client.fullName();
                    const phone = i.client.phones?.[0]?.phone;
                    return phone ? `<div>${name} (<span>${phone}</span>)</div>` : name;
                case "statusName":
                    return i.statusName || "-";
                case "cashName":
                    return i.cashName || "-";
                case "warehouseName":
                    return i.warehouseName || "-";
                case "totalPrice":
                    if (i.priceInfo && typeof i.priceInfo === 'function') {
                        return i.priceInfo();
                    }
                    return formatCurrency(i.totalPrice || 0, i.currencySymbol || '', null, true);
                case "note":
                    if (!i.note) return "";
                    return search ? highlightMatches(i.note, search) : i.note;
                case "description":
                    return i.description || "";
                case "projectName":
                    return i.projectName || "-";

                default:
                    return i[c];
            }
        },

        handlePerPageChange(newPerPage) {
            this.perPage = newPerPage;
            this.fetchItems(1, false);
        },
        async handleCompanyChanged(companyId) {
            this.dateFilter = 'all_time';
            this.startDate = null;
            this.endDate = null;
            this.statusFilter = '';
            this.projectFilter = '';
            this.clientFilter = '';
            this.selectedIds = [];
            this.batchStatusId = '';
            this.paidOrdersFilter = false;
            this.allKanbanItems = [];
            this.kanbanFetchPerPage = 1000;
            
            await this.fetchItems(1, false);
            
            this.$store.dispatch('showNotification', {
              title: 'Компания изменена',
              isDanger: false
            });
        },
        async fetchItems(page = 1, silent = false) {
            if (!silent) this.loading = true;
            try {
                const perPage = this.viewMode === 'kanban' ? 1000 : this.perPage;

                const response = await OrderController.getItems(
                    page,
                    this.searchQuery,
                    this.dateFilter,
                    this.startDate,
                    this.endDate,
                    this.statusFilter,
                    this.projectFilter,
                    this.clientFilter,
                    perPage,
                    this.paidOrdersFilter
                );

                this.data = response;
                this.allKanbanItems = [...response.items];
                this.unpaidOrdersTotal = response.unpaidOrdersTotal || 0;

                if (response.items && response.items.length > 0 && response.items[0].currencySymbol) {
                    this.savedCurrencySymbol = response.items[0].currencySymbol;
                }
            } catch (error) {
                this.showNotification(this.$t('errorGettingOrderList'), error.message, true);
            }
            if (!silent) this.loading = false;
        },
        handleSavedSilent() {
            this.showNotification(this.$t('orderSaved'), "", false);
            this.fetchItems(this.data.currentPage, true);
            if (this.$refs.timelinePanel && !this.timelineCollapsed) {
                this.$refs.timelinePanel.refreshTimeline();
            }
        },

        onAfterSaved() {
            if (this.$refs.timelinePanel && !this.timelineCollapsed) {
                this.$refs.timelinePanel.refreshTimeline();
            }
        },

        
        async fetchStatuses() {
            await this.$store.dispatch('loadOrderStatuses');
            this.statuses = this.$store.getters.orderStatuses;
        },

        async handleChangeStatus(ids, statusId) {
            if (!ids.length) return;
            this.loading = true;
            try {
                const result = await OrderController.batchUpdateStatus({ ids, status_id: statusId });
                
                if (result && result.needs_payment) {
                    this.showPaymentModal(result);
                    this.loading = false;
                    return;
                }
                
                await this.fetchItems(this.data.currentPage, true);
                this.showNotification(this.$t('statusUpdated'), "", false);
                
                if (this.editingItem && ids.includes(this.editingItem.id) && this.$refs.timelinePanel && !this.timelineCollapsed) {
                    this.$refs.timelinePanel.refreshTimeline();
                }
            } catch (e) {
                if (e.response && e.response.status === 422 && e.response.data && e.response.data.needs_payment) {
                    this.showPaymentModal(e.response.data);
                } else {
                    const errors = this.getApiErrorMessage(e);
                    this.showNotification(this.$t('errorChangingStatus'), errors.join("\n"), true);
                }
            }
            this.loading = false;
            this.selectedIds = [];
            this.showBatchStatusSelect = false;
        },

        showPaymentModal(paymentData) {
            const items = this.viewMode === 'kanban' ? this.allKanbanItems : this.data.items;
            const order = items.find(item => item.id === paymentData.order_id);
            if (order) {
                this.showNotification(
                    this.$t('orderNeedsPayment'), 
                    `${this.$t('remainingAmount')}: ${paymentData.remaining_amount} ${order.currencySymbol || ''}`, 
                    true
                );
                
                this.editingTransaction = {
                    orderId: order.id,
                    client: order.client,
                    projectId: order.projectId,
                    cashId: order.cashId,
                    prefillAmount: paymentData.remaining_amount,
                };
                this.transactionModal = true;
            }
        },

        toggleTimeline() {
            this.timelineCollapsed = !this.timelineCollapsed;
        },

        showModal(item) {
            this.editingItem = item;
            this.modalDialog = true;
            this.timelineCollapsed = true;
        },
        closeModal() {
            this.modalDialog = false;
            this.editingItem = null;
            this.timelineCollapsed = true;
        },
        resetFilters() {
            this.dateFilter = 'all_time';
            this.startDate = null;
            this.endDate = null;
            this.statusFilter = '';
            this.projectFilter = '';
            this.clientFilter = '';
            this.paidOrdersFilter = false;
            this.fetchItems();
        },
        getActiveFiltersCount() {
            let count = 0;
            if (this.dateFilter !== 'all_time') count++;
            if (this.statusFilter !== '') count++;
            if (this.projectFilter !== '') count++;
            if (this.clientFilter !== '') count++;
            if (this.paidOrdersFilter !== false) count++;
            if (this.startDate !== null && this.startDate !== '') count++;
            if (this.endDate !== null && this.endDate !== '') count++;
            return count;
        },
        handlePaidOrdersFilterChange(isActive) {
            this.paidOrdersFilter = isActive;
            this.fetchItems();
        },

        createInvoiceFromOrders() {
            if (this.selectedIds.length === 0) {
                this.showNotification(this.$t('error'), this.$t('selectOrdersFirst'), true);
                return;
            }
            
            this.invoiceModalDialog = true;
        },

        getBatchActions() {
            return [
                {
                    label: this.$t('createInvoice'),
                    icon: "fas fa-file-invoice",
                    type: "info",
                    action: this.createInvoiceFromOrders,
                    disabled: false,
                },
                {
                    label: this.$t('delete'),
                    icon: "fas fa-trash",
                    type: "danger",
                    action: this.deleteItems,
                    disabled: this.loadingBatch,
                },
                {
                    label: this.$t('changeStatus'), 
                    icon: "fas fa-edit",
                    type: "light",
                    action: null, 
                    render: true, 
                },
            ];
        },

        handleInvoiceModalClose() {
            this.invoiceModalDialog = false;
        },

        closeInvoiceModal() {
            this.invoiceModalDialog = false;
        },

        handleInvoiceSaved() {
            this.showNotification(this.$t('success'), this.$t('invoiceCreated'), false);
            this.invoiceModalDialog = false;
            this.selectedIds = [];
        },

        handleInvoiceSavedError(error) {
            this.showNotification(this.$t('error'), error, true);
        },

        handleTransactionSaved() {
            this.showNotification(this.$t('success'), this.$t('transactionSaved'), false);
            this.transactionModal = false;
            this.editingTransaction = null;
            this.fetchItems(this.data.currentPage, true);
        },

        async openTransactionFromTimeline(transactionId) {
            try {
                this.editingTransactionItem = await TransactionController.getItem(transactionId);
                this.viewTransactionModal = true;
            } catch (error) {
                const errors = this.getApiErrorMessage(error);
                this.showNotification(this.$t('error'), errors.join("\n"), true);
            }
        },

        handleTransactionViewSaved() {
            this.viewTransactionModal = false;
            this.editingTransactionItem = null;
            if (this.$refs.timelinePanel && !this.timelineCollapsed) {
                this.$refs.timelinePanel.refreshTimeline();
            }
            this.fetchItems(this.data.currentPage, true);
        },

        handleTransactionViewDeleted() {
            this.viewTransactionModal = false;
            this.editingTransactionItem = null;
            if (this.$refs.timelinePanel && !this.timelineCollapsed) {
                this.$refs.timelinePanel.refreshTimeline();
            }
            this.fetchItems(this.data.currentPage, true);
        },

        handleTransactionSavedError(error) {
            this.showNotification(this.$t('error'), error, true);
        },

        handleOrderMoved(updateData) {
            try {
                if (updateData.type === 'status') {
                    const items = this.viewMode === 'kanban' ? this.allKanbanItems : this.data.items;
                    const order = items.find(o => o.id === updateData.orderId);
                    if (order) {
                        order.statusId = updateData.statusId;
                        const status = this.statuses.find(s => s.id === updateData.statusId);
                        if (status) {
                            order.statusName = status.name;
                        }
                    }
                    
                    this.pendingStatusUpdates.set(updateData.orderId, updateData.statusId);
                    
                    this.debouncedStatusUpdate();
                    
                } else if (updateData.type === 'project') {
                    const items = this.viewMode === 'kanban' ? this.allKanbanItems : this.data.items;
                    const order = items.find(o => o.id === updateData.orderId);
                    if (order) {
                        order.projectId = updateData.projectId;
                        const project = this.projects.find(p => p.id === updateData.projectId);
                        if (project) {
                            order.projectName = project.name;
                        }
                    }
                    
                    OrderController.updateItem(updateData.orderId, {
                        project_id: updateData.projectId
                    }).then(() => {
                        this.showNotification(this.$t('success'), this.$t('orderUpdated'), false);
                    }).catch(error => {
                        const errors = this.getApiErrorMessage(error);
                        this.showNotification(this.$t('error'), errors.join("\n"), true);
                        this.fetchItems(this.data.currentPage, true);
                    });
                }
            } catch (error) {
                const errors = this.getApiErrorMessage(error);
                this.showNotification(this.$t('error'), errors.join("\n"), true);
                this.fetchItems(this.data.currentPage, true);
            }
        },

        debouncedStatusUpdate: debounce(function() {
            if (this.pendingStatusUpdates.size === 0) return;
            
            const updatesByStatus = new Map();
            this.pendingStatusUpdates.forEach((statusId, orderId) => {
                if (!updatesByStatus.has(statusId)) {
                    updatesByStatus.set(statusId, []);
                }
                updatesByStatus.get(statusId).push(orderId);
            });
            
            this.pendingStatusUpdates.clear();
            
            const promises = [];
            updatesByStatus.forEach((orderIds, statusId) => {
                const promise = OrderController.batchUpdateStatus({ 
                    ids: orderIds, 
                    status_id: statusId 
                }).then(() => {
                    if (this.editingItem && orderIds.includes(this.editingItem.id) && this.$refs.timelinePanel && !this.timelineCollapsed) {
                        this.$refs.timelinePanel.refreshTimeline();
                    }
                }).catch(error => {
                    const errors = this.getApiErrorMessage(error);
                    this.showNotification(this.$t('error'), errors.join("\n"), true);
                    this.fetchItems(this.data.currentPage, true);
                });
                promises.push(promise);
            });
            
            Promise.all(promises).then(() => {
                this.showNotification(this.$t('success'), this.$t('statusUpdated'), false);
            });
        }, 500),

        toggleSelectRow(id) {
            if (this.selectedIds.includes(id)) {
                this.selectedIds = this.selectedIds.filter(x => x !== id);
            } else {
                this.selectedIds = [...this.selectedIds, id];
            }
        },

        handleColumnSelectToggle(orderIds, select) {
            if (select) {
                const newSelectedIds = [...this.selectedIds];
                orderIds.forEach(id => {
                    if (!newSelectedIds.includes(id)) {
                        newSelectedIds.push(id);
                    }
                });
                this.selectedIds = newSelectedIds;
            } else {
                this.selectedIds = this.selectedIds.filter(id => !orderIds.includes(id));
            }
        },

        handleBatchStatusChange() {
            if (!this.batchStatusId || this.selectedIds.length === 0) return;
            
            this.handleChangeStatus(this.selectedIds, this.batchStatusId);
            this.batchStatusId = '';
            this.selectedIds = [];
        },

        handleBatchStatusChangeFromToolbar(statusId) {
            if (!statusId || this.selectedIds.length === 0) return;
            
            this.handleChangeStatus(this.selectedIds, statusId);
            this.batchStatusId = '';
            this.selectedIds = [];
        },

        changeViewMode(mode) {
            if (!['table', 'kanban'].includes(mode)) {
                return;
            }
            this.viewMode = mode;
        }
    },
    watch: {
        viewMode: {
            handler(newMode) {
                try {
                    localStorage.setItem('orders_viewMode', newMode);
                } catch (error) {
                    console.warn('Failed to save view mode to localStorage:', error);
                }
                
                if (newMode === 'kanban') {
                    this.kanbanFetchPerPage = 1000;
                    this.allKanbanItems = [];
                    this.kanbanCurrentPage = 1;
                    this.$nextTick(() => {
                        this.fetchItems(1, false);
                    });
                } else {
                    const savedPerPage = localStorage.getItem('perPage');
                    const newPerPage = savedPerPage ? parseInt(savedPerPage) : 10;
                    this.perPage = newPerPage;
                    this.allKanbanItems = [];
                    this.$nextTick(() => {
                        this.fetchItems(1, false);
                    });
                }
            },
            immediate: false
        }
    },
    mounted() {
        try {
            const savedViewMode = localStorage.getItem('orders_viewMode');
            if (savedViewMode && ['table', 'kanban'].includes(savedViewMode)) {
                this.viewMode = savedViewMode;
                
                if (savedViewMode === 'kanban') {
                    this.kanbanFetchPerPage = 1000;
                    this.allKanbanItems = [];
                    this.kanbanCurrentPage = 1;
                } else {
                    const savedPerPage = localStorage.getItem('perPage');
                    this.perPage = savedPerPage ? parseInt(savedPerPage) : 10;
                }
            } else {
                try {
                    localStorage.setItem('orders_viewMode', this.viewMode);
                } catch (error) {
                    console.warn('Failed to save default view mode to localStorage:', error);
                }
                if (this.viewMode === 'kanban') {
                    this.kanbanFetchPerPage = 1000;
                    this.allKanbanItems = [];
                    this.kanbanCurrentPage = 1;
                } else {
                    const savedPerPage = localStorage.getItem('perPage');
                    this.perPage = savedPerPage ? parseInt(savedPerPage) : 10;
                }
            }
            
            this.fetchItems();
        } catch (error) {
            console.warn('Failed to read view mode from localStorage:', error);
            this.fetchItems();
        }
    }
};
</script>

<style scoped>
.kanban-view-container {
    width: 100%;
}
</style>