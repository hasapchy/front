<template>
    <div>
        <transition name="fade" mode="out-in">
            <div v-if="data && !loading && viewMode === 'table'" :key="`table-${$i18n.locale}`">
                <DraggableTable table-key="admin.orders" :columns-config="columnsConfig" :table-data="data.items"
                    :item-mapper="itemMapper" :onItemClick="onItemClick" @selectionChange="selectedIds = $event">
                    <template #tableControlsBar="{ resetColumns, columns, toggleVisible, log }">
                        <TableControlsBar :show-filters="true" :has-active-filters="hasActiveFilters"
                            :active-filters-count="getActiveFiltersCount()" :on-filters-reset="resetFilters"
                            :show-pagination="true"
                            :pagination-data="data ? { currentPage: data.currentPage, lastPage: data.lastPage, perPage: perPage, perPageOptions: perPageOptions } : null"
                            :on-page-change="fetchItems" :on-per-page-change="handlePerPageChange"
                            :resetColumns="resetColumns" :columns="columns" :toggleVisible="toggleVisible" :log="log">
                            <template #left>
                                <PrimaryButton :onclick="() => showModal(null)" icon="fas fa-plus"
                                    :disabled="!$store.getters.hasPermission('orders_create')">
                                </PrimaryButton>

                                <transition name="fade">
                                    <BatchButton v-if="selectedIds.length" :selected-ids="selectedIds"
                                        :batch-actions="getBatchActions()"
                                        :show-batch-status-select="showBatchStatusSelect" :statuses="statuses"
                                        :handle-change-status="handleChangeStatus" :show-status-select="true" />
                                </transition>

                                <OrderFilters :dateFilter="dateFilter" :startDate="startDate" :endDate="endDate"
                                    :statusFilter="statusFilter" :projectFilter="projectFilter"
                                    :clientFilter="clientFilter" :statuses="statuses" :projects="projects"
                                    :clients="clients" :has-active-filters="hasActiveFilters"
                                    :active-filters-count="getActiveFiltersCount()"
                                    @update:dateFilter="dateFilter = $event" @update:startDate="startDate = $event"
                                    @update:endDate="endDate = $event" @update:statusFilter="statusFilter = $event"
                                    @update:projectFilter="projectFilter = $event"
                                    @update:clientFilter="clientFilter = $event" @reset="resetFilters"
                                    @apply="applyFilters" />

                                <ViewModeToggle :view-mode="viewMode" @change="changeViewMode" />
                            </template>

                            <template #right="{ resetColumns, columns, toggleVisible, log }">
                                <OrderPaymentFilter v-model="paidOrdersFilter" :orders="data ? data.items : []"
                                    :statusId="4" :currencySymbol="currencySymbol"
                                    :unpaidOrdersTotal="unpaidOrdersTotal" @change="handlePaidOrdersFilterChange" />
                                <Pagination v-if="data != null" :currentPage="data.currentPage"
                                    :lastPage="data.lastPage" :per-page="perPage" :per-page-options="perPageOptions"
                                    :show-per-page-selector="true" @changePage="fetchItems"
                                    @perPageChange="handlePerPageChange" />
                                <TableFilterButton v-if="viewMode === 'table'" :onReset="resetColumns">
                                    <ul>
                                        <draggable v-if="columns && columns.length" class="dragArea list-group w-full"
                                            :list="columns" @change="log">
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

                            <template #gear>
                            </template>
                        </TableControlsBar>
                    </template>
                </DraggableTable>
            </div>

            <div v-else-if="data && viewMode === 'kanban'" key="kanban-view" class="kanban-view-container">
                <TableControlsBar :show-filters="true" :has-active-filters="hasActiveFilters"
                    :active-filters-count="getActiveFiltersCount()" :on-filters-reset="resetFilters"
                    :show-pagination="false">
                    <template #left>
                        <PrimaryButton :onclick="() => showModal(null)" icon="fas fa-plus"
                            :disabled="!$store.getters.hasPermission('orders_create')">
                        </PrimaryButton>

                        <OrderFilters :dateFilter="dateFilter" :startDate="startDate" :endDate="endDate"
                            :statusFilter="statusFilter" :projectFilter="projectFilter" :clientFilter="clientFilter"
                            :statuses="statuses" :projects="projects" :clients="clients"
                            :has-active-filters="hasActiveFilters" :active-filters-count="getActiveFiltersCount()"
                            @update:dateFilter="dateFilter = $event" @update:startDate="startDate = $event"
                            @update:endDate="endDate = $event" @update:statusFilter="statusFilter = $event"
                            @update:projectFilter="projectFilter = $event" @update:clientFilter="clientFilter = $event"
                            @reset="resetFilters" @apply="applyFilters" />

    <SideModalDialog :showForm="modalDialog" :onclose="handleModalClose" :timelineCollapsed="timelineCollapsed"
        :showTimelineButton="!!editingItem" @toggle-timeline="toggleTimeline">
        <OrderCreatePage v-if="modalDialog && !isBasementMode" :key="editingItem ? editingItem.id : 'new-order'" ref="ordercreatepageForm"
            @saved="handleSaved" @saved-silent="handleSavedSilent" @saved-error="handleSavedError"
            @deleted="handleDeleted" @deleted-error="handleDeletedError" @close-request="closeModal"
            :editingItem="editingItem" />
        <BasementOrderCreatePage v-if="modalDialog && isBasementMode" :key="editingItem ? editingItem.id : 'new-order'" ref="basementOrderCreatePageForm"
            @saved="handleSaved" @saved-silent="handleSavedSilent" @saved-error="handleSavedError"
            @deleted="handleDeleted" @deleted-error="handleDeletedError" @close-request="closeModal"
            :editingItem="editingItem" />

                <div v-if="selectedIds.length && viewMode === 'kanban'" class="mb-4">
                    <BatchButton :selected-ids="selectedIds" :batch-actions="getBatchActions()"
                        :show-batch-status-select="showBatchStatusSelect" :statuses="statuses"
                        :handle-change-status="handleChangeStatus" :show-status-select="true" />
                </div>

                <KanbanBoard :orders="allKanbanItems" :statuses="statuses" :projects="projects"
                    :selected-ids="selectedIds" :loading="loading || kanbanLoadingMore"
                    :currency-symbol="currencySymbol" :batch-status-id="batchStatusId" :has-more="kanbanHasMore"
                    :hide-batch-actions="true" @order-moved="handleOrderMoved" @card-dblclick="onItemClick"
                    @card-select-toggle="toggleSelectRow" @column-select-toggle="handleColumnSelectToggle"
                    @batch-status-change="handleBatchStatusChangeFromToolbar"
                    @batch-delete="() => deleteItems(selectedIds)" @clear-selection="() => selectedIds = []"
                    @load-more="loadMoreKanbanItems" />
            </div>

            <div v-else key="loader" class="flex justify-center items-center h-64">
                <SpinnerIcon />
            </div>
        </transition>

        <SideModalDialog :showForm="modalDialog" :onclose="handleModalClose" :timelineCollapsed="timelineCollapsed"
            :showTimelineButton="!!editingItem" @toggle-timeline="toggleTimeline">
            <OrderCreatePage v-if="modalDialog" :key="editingItem ? editingItem.id : 'new-order'"
                ref="ordercreatepageForm" @saved="handleSaved" @saved-silent="handleSavedSilent"
                @saved-error="handleSavedError" @deleted="handleDeleted" @deleted-error="handleDeletedError"
                @close-request="closeModal" :editingItem="editingItem" />

            <template #timeline>
                <TimelinePanel v-if="editingItem && !timelineCollapsed" ref="timelinePanel" :type="'order'"
                    :id="editingItem.id" @toggle-timeline="toggleTimeline"
                    @open-transaction="openTransactionFromTimeline" />
            </template>
        </SideModalDialog>

        <SideModalDialog :showForm="invoiceModalDialog" :onclose="handleInvoiceModalClose">
            <InvoiceCreatePage v-if="invoiceModalDialog" ref="invoiceCreateForm" @saved="handleInvoiceSaved"
                @saved-error="handleInvoiceSavedError" @close-request="closeInvoiceModal"
                :preselectedOrderIds="selectedIds || []" />
        </SideModalDialog>

        <SideModalDialog :showForm="viewTransactionModal"
            :onclose="() => { viewTransactionModal = false; editingTransactionItem = null; }">
            <TransactionCreatePage v-if="viewTransactionModal" :editingItem="editingTransactionItem"
                @saved="handleTransactionViewSaved" @saved-error="handleTransactionSavedError"
                @deleted="handleTransactionViewDeleted" @deleted-error="handleTransactionSavedError"
                @close-request="() => { viewTransactionModal = false; editingTransactionItem = null; }" />
        </SideModalDialog>

        <SideModalDialog :showForm="transactionModal" :onclose="() => transactionModal = false">
            <TransactionCreatePage v-if="editingTransaction" :editingItem="null"
                :initial-client="editingTransaction.client" :initial-project-id="editingTransaction.projectId"
                :order-id="editingTransaction.orderId" :default-cash-id="editingTransaction.cashId"
                :prefill-amount="editingTransaction.prefillAmount"
                :prefill-currency-id="editingTransaction.prefillCurrencyId" :is-payment-modal="true"
                :form-config="orderTransactionFormConfig" @saved="handleTransactionSaved"
                @saved-error="handleTransactionSavedError" @close-request="() => transactionModal = false" />
        </SideModalDialog>

        <NotificationToast :title="notificationTitle" :subtitle="notificationSubtitle" :show="notification"
            :is-danger="notificationIsDanger" @close="closeNotification" />
        <AlertDialog :dialog="deleteDialog" :descr="`${$t('confirmDeleteSelected')} (${selectedIds.length})?`"
            :confirm-text="$t('deleteSelected')" :leave-text="$t('cancel')" @confirm="confirmDeleteItems"
            @leave="deleteDialog = false" />

        <PrintInvoiceDialog :dialog="printInvoiceDialog" :loading="printInvoiceLoading"
            @close="printInvoiceDialog = false" @print="handlePrintInvoice" />
    </div>
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
import BasementOrderCreatePage from "@/views/pages/basement/BasementOrderCreatePage.vue";
import InvoiceCreatePage from "@/views/pages/invoices/InvoiceCreatePage.vue";
import TransactionCreatePage from "@/views/pages/transactions/TransactionCreatePage.vue";
import TransactionController from "@/api/TransactionController";
import ClientButtonCell from "@/views/components/app/buttons/ClientButtonCell.vue";
import OrderStatusController from "@/api/OrderStatusController";
import { markRaw } from "vue";
import BatchButton from "@/views/components/app/buttons/BatchButton.vue";
import getApiErrorMessage from "@/mixins/getApiErrorMessageMixin";
import crudEventMixin from "@/mixins/crudEventMixin";
import notificationMixin from "@/mixins/notificationMixin";
import batchActionsMixin from "@/mixins/batchActionsMixin";
import modalMixin from "@/mixins/modalMixin";
import AlertDialog from "@/views/components/app/dialog/AlertDialog.vue";
import { translateOrderStatus } from '@/utils/translationUtils';
import { defineAsyncComponent } from "vue";
import { eventBus } from "@/eventBus";
import OrderPaymentFilter from "@/views/components/app/forms/OrderPaymentFilter.vue";
import StatusSelectCell from "@/views/components/app/buttons/StatusSelectCell.vue";
import debounce from "lodash.debounce";
import companyChangeMixin from "@/mixins/companyChangeMixin";
import searchMixin from "@/mixins/searchMixin";
import filtersMixin from "@/mixins/filtersMixin";
import storeDataLoaderMixin from "@/mixins/storeDataLoaderMixin";
import { formatCurrency } from "@/utils/numberUtils";
import { highlightMatches } from "@/utils/searchUtils";
import SpinnerIcon from "@/views/components/app/SpinnerIcon.vue";
import { TRANSACTION_FORM_PRESETS } from "@/constants/transactionFormPresets";
import KanbanFieldsButton from "@/views/components/app/kanban/KanbanFieldsButton.vue";
import PrintInvoiceDialog from "@/views/components/app/dialog/PrintInvoiceDialog.vue";
import printInvoiceMixin from "@/mixins/printInvoiceMixin";
import OrderFilters from "@/views/components/orders/OrderFilters.vue";
import ViewModeToggle from "@/views/components/app/ViewModeToggle.vue";

const TimelinePanel = defineAsyncComponent(() =>
    import("@/views/components/app/dialog/TimelinePanel.vue")
);

export default {
    mixins: [getApiErrorMessage, crudEventMixin, notificationMixin, modalMixin, batchActionsMixin, companyChangeMixin, searchMixin, filtersMixin, printInvoiceMixin, storeDataLoaderMixin],
    components: { NotificationToast, SideModalDialog, PrimaryButton, Pagination, DraggableTable, KanbanBoard, OrderCreatePage, BasementOrderCreatePage, InvoiceCreatePage, TransactionCreatePage, ClientButtonCell, OrderStatusController, BatchButton, AlertDialog, TimelinePanel, OrderPaymentFilter, StatusSelectCell, SpinnerIcon, FiltersContainer, TableControlsBar, TableFilterButton, KanbanFieldsButton, PrintInvoiceDialog, OrderFilters, ViewModeToggle, draggable: VueDraggableNext },
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
            controller: OrderController,
            cacheInvalidationType: 'orders',
            errorGettingItemText: this.$t('errorGettingOrder'),
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
                { name: "products", label: 'products', html: true },
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
            kanbanCurrentPage: 1,
            kanbanFetchPerPage: 50,
            kanbanHasMore: false,
            kanbanLoadingMore: false,
            printInvoiceDialog: false,
            printInvoiceLoading: false,
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
            return this.data?.items?.[0]?.currencySymbol || this.savedCurrencySymbol || '';
        },
        orderTransactionFormConfig() {
            return TRANSACTION_FORM_PRESETS.orderPayment;
        },
        isBasementMode() {
            return this.$route.meta.basementMode;
        },
        itemViewRouteName() {
            // Для basement режима не нужен маршрут, только модалка
            return this.isBasementMode ? null : 'OrderView';
        },
        baseRouteName() {
            return this.isBasementMode ? 'BasementOrders' : 'Orders';
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
        },
        '$route.params.id': {
            immediate: true,
            handler(value) {
                if (value) {
                    this.handleRouteItem(value);
                } else {
                    if (this.modalDialog) {
                        this.closeModal();
                    }
                    this.editingItem = null;
                }
            }
        }
    },
    methods: {
        translateOrderStatus,
        onItemClick(item) {
            if (this.isBasementMode) {
                // Для basement режима - только модалка, без перехода на отдельную страницу
                if (!item?.id) {
                    return;
                }
                this.showModal(item);
                return;
            }
            // Для обычного режима - стандартная логика из modalMixin
            return modalMixin.methods.onItemClick.call(this, item);
        },
        itemMapper(i, c) {
            const search = this.searchQuery;

            switch (c) {
                case "products":
                    return i.productsHtmlList();
                case "dateUser":
                    return `${i.formatDate()} / ${i.user?.name || i.userName || "-"}`;
                case "client":
                    if (!i.client) return '<span class="text-gray-500">' + this.$t('notSpecified') + '</span>';
                    const name = i.client.fullName();
                    const phone = i.client.phones?.[0]?.phone;
                    return phone ? `<div>${name} (<span>${phone}</span>)</div>` : name;
                case "statusName":
                    const statusName = i.status?.name || i.statusName || '';
                    return statusName ? translateOrderStatus(statusName, this.$t) : '-';
                case "cashName":
                    return i.cash?.name || i.cashName || "-";
                case "warehouseName":
                    return i.warehouse?.name || i.warehouseName || "-";
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
                    return i.project?.name || i.projectName || "-";

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
            this.kanbanCurrentPage = 1;
            this.kanbanHasMore = false;

            await this.fetchItems(1, false);

            this.$store.dispatch('showNotification', {
                title: 'Компания изменена',
                isDanger: false
            });
        },
        async fetchItems(page = 1, silent = false) {
            if (!silent) this.loading = true;

            if (this.viewMode === 'kanban' && page === 1) {
                this.resetKanbanPagination();
            }

            try {
                const perPage = this.viewMode === 'kanban' ? this.kanbanFetchPerPage : this.perPage;

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

                if (this.viewMode === 'kanban') {
                    this.allKanbanItems = [...response.items];
                    this.kanbanCurrentPage = response.currentPage;
                    this.kanbanHasMore = response.nextPage != null;
                } else {
                    this.allKanbanItems = [];
                }

                this.unpaidOrdersTotal = response.unpaidOrdersTotal || 0;

                if (response.items?.[0]?.currencySymbol) {
                    this.savedCurrencySymbol = response.items[0].currencySymbol;
                }
            } catch (error) {
                this.showNotification(this.$t('errorGettingOrderList'), error.message, true);
            }
            if (!silent) this.loading = false;
        },
        async loadMoreKanbanItems() {
            if (this.kanbanLoadingMore || !this.kanbanHasMore || this.viewMode !== 'kanban') {
                return;
            }

            this.kanbanLoadingMore = true;
            try {
                const nextPage = this.kanbanCurrentPage + 1;
                const response = await OrderController.getItems(
                    nextPage,
                    this.searchQuery,
                    this.dateFilter,
                    this.startDate,
                    this.endDate,
                    this.statusFilter,
                    this.projectFilter,
                    this.clientFilter,
                    this.kanbanFetchPerPage,
                    this.paidOrdersFilter
                );

                this.allKanbanItems = [...this.allKanbanItems, ...response.items];
                this.kanbanCurrentPage = response.currentPage;
                this.kanbanHasMore = response.nextPage != null;
            } catch (error) {
                this.showNotification(this.$t('errorGettingOrderList'), error.message, true);
            } finally {
                this.kanbanLoadingMore = false;
            }
        },
        refreshTimelineIfVisible() {
            if (this.$refs.timelinePanel && !this.timelineCollapsed) {
                this.$refs.timelinePanel.refreshTimeline();
            }
        },
        handleSavedSilent() {
            this.showNotification(this.$t('orderSaved'), "", false);
            this.fetchItems(this.data.currentPage, true);
            this.refreshTimelineIfVisible();
        },

        onAfterSaved() {
            this.refreshTimelineIfVisible();
        },


        async fetchStatuses() {
            await this.loadStoreData({
                getterName: 'orderStatuses',
                dispatchName: 'loadOrderStatuses',
                localProperty: 'statuses',
                transform: (statuses) => statuses.filter(status => status.isActive !== false),
                defaultValue: []
            });
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

                if (this.editingItem && ids.includes(this.editingItem.id)) {
                    this.refreshTimelineIfVisible();
                }
            } catch (e) {
                if (e.response?.status === 422 && e.response.data?.needs_payment) {
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

        getCurrentItems() {
            return this.viewMode === 'kanban' ? this.allKanbanItems : (this.data?.items || []);
        },
        showPaymentModal(paymentData) {
            const order = this.getCurrentItems().find(item => item.id === paymentData.order_id);
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
                    prefillCurrencyId: order.currencyId,
                };
                this.transactionModal = true;
            }
        },

        toggleTimeline() {
            this.timelineCollapsed = !this.timelineCollapsed;
        },

        showModal(item = null) {
            modalMixin.methods.showModal.call(this, item);
            this.timelineCollapsed = true;
        },
        closeModal(skipScrollRestore = false) {
            modalMixin.methods.closeModal.call(this, skipScrollRestore);
            if (this.$route.params.id) {
                this.$router.replace({ name: 'Orders' });
            }
            this.editingItem = null;
            this.timelineCollapsed = true;
        },
        resetFilters() {
            this.resetFiltersFromConfig({
                dateFilter: 'all_time',
                startDate: null,
                endDate: null,
                statusFilter: '',
                projectFilter: '',
                clientFilter: '',
                paidOrdersFilter: false
            });
        },
        getActiveFiltersCount() {
            return this.getActiveFiltersCountFromConfig([
                { value: this.dateFilter, defaultValue: 'all_time' },
                { value: this.statusFilter, defaultValue: '' },
                { value: this.projectFilter, defaultValue: '' },
                { value: this.clientFilter, defaultValue: '' },
                { value: this.paidOrdersFilter, defaultValue: false },
                { value: this.startDate, defaultValue: null },
                { value: this.endDate, defaultValue: null }
            ]);
        },
        handlePaidOrdersFilterChange(isActive) {
            this.paidOrdersFilter = isActive;
            if (this.viewMode === 'kanban') {
                this.resetKanbanPagination();
            }
            this.fetchItems();
        },

        createInvoiceFromOrders() {
            if (!this.selectedIds?.length) {
                this.showNotification(this.$t('error'), this.$t('selectOrdersFirst'), true);
                return;
            }

            this.invoiceModalDialog = true;
        },

        showPrintInvoiceDialog() {
            if (!this.selectedIds?.length) {
                this.showNotification(this.$t('error'), this.$t('selectOrdersFirst'), true);
                return;
            }

            this.printInvoiceDialog = true;
        },

        async handlePrintInvoice(variants) {
            this.printInvoiceLoading = true;
            try {
                const selectedOrders = this.getCurrentItems().filter(order =>
                    order &&
                    this.selectedIds.includes(order.id) &&
                    order.products?.length > 0
                );

                if (!selectedOrders.length) {
                    this.showNotification(this.$t('error'), 'В выбранных заказах нет товаров', true);
                    return;
                }

                await this.printInvoiceFromOrders(selectedOrders, variants);
                this.printInvoiceDialog = false;
            } catch (error) {
                console.error('Ошибка в handlePrintInvoice:', error);
                this.showNotification(this.$t('error'), this.$t('errorGeneratingPdf') || 'Ошибка генерации PDF', true);
            } finally {
                this.printInvoiceLoading = false;
            }
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
                    label: this.$t('printInvoice'),
                    icon: "fas fa-print",
                    type: "info",
                    action: this.showPrintInvoiceDialog,
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
            this.handleInvoiceModalClose();
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
            this.refreshTimelineIfVisible();
            this.fetchItems(this.data.currentPage, true);
        },

        handleTransactionViewDeleted() {
            this.viewTransactionModal = false;
            this.editingTransactionItem = null;
            this.refreshTimelineIfVisible();
            this.fetchItems(this.data.currentPage, true);
        },

        handleTransactionSavedError(error) {
            this.showNotification(this.$t('error'), error, true);
        },

        handleOrderMoved(updateData) {
            try {
                if (updateData.type === 'status') {
                    const order = this.getCurrentItems().find(o => o.id === updateData.orderId);
                    if (order) {
                        order.statusId = updateData.statusId;
                        const status = this.statuses.find(s => s.id === updateData.statusId);
                        if (status) {
                            order.status = status;
                            order.statusName = translateOrderStatus(status.name, this.$t);
                        }
                    }

                    this.pendingStatusUpdates.set(updateData.orderId, updateData.statusId);

                    this.debouncedStatusUpdate();

                } else if (updateData.type === 'project') {
                    const order = this.getCurrentItems().find(o => o.id === updateData.orderId);
                    if (order) {
                        order.projectId = updateData.projectId;
                        const project = this.projects.find(p => p.id === updateData.projectId);
                        if (project) {
                            order.project = project;
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

        debouncedStatusUpdate: debounce(function () {
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
                    if (this.editingItem && orderIds.includes(this.editingItem.id)) {
                        this.refreshTimelineIfVisible();
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

        handleBatchStatusChange(statusId = null) {
            const targetStatusId = statusId || this.batchStatusId;
            if (!targetStatusId || !this.selectedIds?.length) return;

            this.handleChangeStatus(this.selectedIds, targetStatusId);
            this.batchStatusId = '';
            this.selectedIds = [];
        },

        handleBatchStatusChangeFromToolbar(statusId) {
            this.handleBatchStatusChange(statusId);
        },

        changeViewMode(mode) {
            if (!['table', 'kanban'].includes(mode)) {
                return;
            }
            this.viewMode = mode;
        },
        resetKanbanPagination() {
            this.allKanbanItems = [];
            this.kanbanCurrentPage = 1;
            this.kanbanHasMore = false;
            this.kanbanLoadingMore = false;
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
                    this.resetKanbanPagination();
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
            } else {
                try {
                    localStorage.setItem('orders_viewMode', this.viewMode);
                } catch (error) {
                    console.warn('Failed to save default view mode to localStorage:', error);
                }
            }

            if (this.viewMode === 'kanban') {
                this.resetKanbanPagination();
            } else {
                const savedPerPage = localStorage.getItem('perPage');
                this.perPage = savedPerPage ? parseInt(savedPerPage) : 10;
            }

            this.fetchItems();

            if (this.$route.params.id) {
                this.$nextTick(() => {
                    this.handleRouteItem(this.$route.params.id);
                });
            }
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