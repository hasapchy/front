<template>
  <div>
    <transition
      name="fade"
      mode="out-in"
    >
      <div
        v-if="data && !loading && viewMode === 'table'"
        :key="`table-${$i18n.locale}`"
      >
        <DraggableTable
          table-key="admin.orders"
          :columns-config="columnsConfig"
          :table-data="data.items"
          :disable-local-sort="true"
          :item-mapper="itemMapper"
          :on-item-click="onItemClick"
          @selection-change="selectedIds = $event"
        >
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
              :export-permission="exportPermission"
              :on-export="handleExport"
              :export-loading="exportLoading"
              :reset-columns="resetColumns"
              :columns="columns"
              :toggle-visible="toggleVisible"
              :log="log"
            >
              <template #left>
                <PrimaryButton
                  :onclick="() => showModal(null)"
                  icon="fas fa-plus"
                  :disabled="!$store.getters.hasPermission('orders_create')"
                />
                <PrimaryButton
                  v-if="$store.getters.hasPermission(exportPermission)"
                  icon="fas fa-file-excel"
                  :onclick="handleExport"
                  :disabled="exportLoading"
                  :aria-label="$t('export')"
                />

                <transition name="fade">
                  <BatchButton
                    v-if="selectedIds.length"
                    :selected-ids="selectedIds"
                    :batch-actions="getBatchActions()"
                    :show-batch-status-select="showBatchStatusSelect"
                    :statuses="statuses"
                    :handle-change-status="handleChangeStatus"
                    :show-status-select="true"
                  />
                </transition>

                <OrderFilters
                  :date-filter="dateFilter"
                  :start-date="startDate"
                  :end-date="endDate"
                  :status-filter="statusFilter"
                  :project-filter="projectFilter"
                  :client-filter="clientFilter"
                  :statuses="statuses"
                  :projects="projects"
                  :clients="clients"
                  :has-active-filters="hasActiveFilters"
                  :active-filters-count="getActiveFiltersCount()"
                  @update:date-filter="dateFilter = $event"
                  @update:start-date="startDate = $event"
                  @update:end-date="endDate = $event"
                  @update:status-filter="statusFilter = $event"
                  @update:project-filter="projectFilter = $event"
                  @update:client-filter="clientFilter = $event"
                  @reset="resetFilters"
                  @apply="applyFilters"
                />

                <ViewModeToggle
                  :view-mode="viewMode"
                  @change="changeViewMode"
                />
              </template>

              <template #right="{ resetColumns, columns, toggleVisible, log }">
                <OrderPaymentFilter
                  v-model="paidOrdersFilter"
                  :orders="data ? data.items : []"
                  :status-id="4"
                  :currency-symbol="currencySymbol"
                  :unpaid-orders-total="unpaidOrdersTotal"
                  @change="handlePaidOrdersFilterChange"
                />
                <Pagination
                  v-if="data != null"
                  :current-page="data.currentPage"
                  :last-page="data.lastPage"
                  :per-page="perPage"
                  :per-page-options="perPageOptions"
                  :show-per-page-selector="true"
                  @change-page="fetchItems"
                  @per-page-change="handlePerPageChange"
                />
                <TableFilterButton
                  v-if="viewMode === 'table'"
                  :on-reset="resetColumns"
                >
                  <ul>
                    <draggable
                      v-if="columns && columns.length"
                      class="dragArea list-group w-full"
                      :list="columns"
                      @change="log"
                    >
                      <li
                        v-for="(element, index) in columns"
                        v-show="element.name !== 'select'"
                        :key="element.name"
                        class="flex items-center hover:bg-gray-100 p-2 rounded"
                        @click="toggleVisible(index)"
                      >
                        <div class="space-x-2 flex flex-row justify-between w-full select-none">
                          <div>
                            <i
                              class="text-sm mr-2 text-[#337AB7]"
                              :class="[element.visible ? 'fas fa-circle-check' : 'far fa-circle']"
                            />
                            {{ $te(element.label) ? $t(element.label) : element.label }}
                          </div>
                          <div>
                            <i
                              class="fas fa-grip-vertical text-gray-300 text-sm cursor-grab"
                            />
                          </div>
                        </div>
                      </li>
                    </draggable>
                  </ul>
                </TableFilterButton>
              </template>

              <template #gear />
            </TableControlsBar>
          </template>
        </DraggableTable>
      </div>

      <div
        v-else-if="viewMode === 'kanban'"
        key="kanban-view"
        class="kanban-view-container"
      >
        <TableControlsBar
          :show-filters="true"
          :has-active-filters="hasActiveFilters"
          :active-filters-count="getActiveFiltersCount()"
          :on-filters-reset="resetFilters"
          :show-pagination="false"
          :export-permission="exportPermission"
          :on-export="handleExport"
          :export-loading="exportLoading"
        >
          <template #left>
            <PrimaryButton
              :onclick="() => showModal(null)"
              icon="fas fa-plus"
              :disabled="!$store.getters.hasPermission('orders_create')"
            />
            <PrimaryButton
              v-if="$store.getters.hasPermission(exportPermission)"
              icon="fas fa-file-excel"
              :onclick="handleExport"
              :disabled="exportLoading"
              :aria-label="$t('export')"
            />

            <transition name="fade">
              <BatchButton
                v-if="selectedIds.length"
                :selected-ids="selectedIds"
                :batch-actions="getBatchActions()"
                :show-batch-status-select="showBatchStatusSelect"
                :statuses="statuses"
                :handle-change-status="handleChangeStatus"
                :show-status-select="true"
              />
            </transition>

            <OrderFilters
              :date-filter="dateFilter"
              :start-date="startDate"
              :end-date="endDate"
              :status-filter="statusFilter"
              :project-filter="projectFilter"
              :client-filter="clientFilter"
              :statuses="statuses"
              :projects="projects"
              :clients="clients"
              :has-active-filters="hasActiveFilters"
              :active-filters-count="getActiveFiltersCount()"
              @update:date-filter="dateFilter = $event"
              @update:start-date="startDate = $event"
              @update:end-date="endDate = $event"
              @update:status-filter="statusFilter = $event"
              @update:project-filter="projectFilter = $event"
              @update:client-filter="clientFilter = $event"
              @reset="resetFilters"
              @apply="applyFilters"
            />

            <ViewModeToggle
              :view-mode="viewMode"
              @change="changeViewMode"
            />
          </template>
          <template #right>
            <KanbanFieldsButton mode="orders" />
          </template>
        </TableControlsBar>

        <div class="kanban-board-area">
          <KanbanBoard
            :orders="allKanbanItems"
            :statuses="statuses"
            :projects="projects"
            :selected-ids="selectedIds"
            :loading="loading"
            :currency-symbol="currencySymbol"
            :status-meta="kanbanByStatus"
            @order-moved="handleOrderMoved"
            @card-dblclick="onItemClick"
            @card-select-toggle="toggleSelectRow"
            @column-select-toggle="handleColumnSelectToggle"
            @load-more="loadMoreKanbanItems($event)"
          />
        </div>
      </div>

      <div
        v-else
        key="loader"
        class="min-h-64"
      >
        <TableSkeleton />
      </div>
    </transition>

    <SideModalDialog
      :show-form="modalDialog"
      :onclose="handleModalClose"
      :timeline-collapsed="timelineCollapsed"
      :show-timeline-button="!!editingItem"
      @toggle-timeline="toggleTimeline"
    >
      <OrderCreatePage
        v-if="modalDialog"
        :key="editingItem ? editingItem.id : 'new-order'"
        ref="ordercreatepageForm"
        :editing-item="editingItem"
        @saved="handleSaved"
        @saved-silent="handleSavedSilent"
        @saved-error="handleSavedError"
        @deleted="handleDeleted"
        @deleted-error="handleDeletedError"
        @close-request="closeModal"
      />

      <template #timeline>
        <TimelinePanel
          v-if="editingItem && !timelineCollapsed"
          :id="editingItem.id"
          ref="timelinePanel"
          :type="'order'"
          @toggle-timeline="toggleTimeline"
          @open-transaction="openTransactionFromTimeline"
        />
      </template>
    </SideModalDialog>

    <SideModalDialog
      :show-form="invoiceModalDialog"
      :onclose="handleInvoiceModalClose"
    >
      <InvoiceCreatePage
        v-if="invoiceModalDialog"
        ref="invoiceCreateForm"
        :preselected-order-ids="selectedIds || []"
        @saved="handleInvoiceSaved"
        @saved-error="handleInvoiceSavedError"
        @close-request="closeInvoiceModal"
      />
    </SideModalDialog>

    <SideModalDialog
      :show-form="viewTransactionModal"
      :onclose="() => { viewTransactionModal = false; editingTransactionItem = null; }"
    >
      <TransactionCreatePage
        v-if="viewTransactionModal"
        :editing-item="editingTransactionItem"
        @saved="handleTransactionViewSaved"
        @saved-error="handleTransactionSavedError"
        @deleted="handleTransactionViewDeleted"
        @deleted-error="handleTransactionSavedError"
        @close-request="() => { viewTransactionModal = false; editingTransactionItem = null; }"
      />
    </SideModalDialog>

    <SideModalDialog
      :show-form="transactionModal"
      :onclose="closeTransactionModal"
    >
      <TransactionCreatePage
        v-if="editingTransaction"
        :editing-item="null"
        :initial-client="editingTransaction.client"
        :initial-project-id="editingTransaction.projectId"
        :order-id="editingTransaction.orderId"
        :default-cash-id="editingTransaction.cashId"
        :prefill-amount="editingTransaction.prefillAmount"
        :prefill-currency-id="editingTransaction.prefillCurrencyId"
        :is-payment-modal="true"
        :form-config="orderTransactionFormConfig"
        @saved="handleTransactionSaved"
        @saved-error="handleTransactionSavedError"
        @close-request="closeTransactionModal"
      />
    </SideModalDialog>

    <AlertDialog
      :dialog="deleteDialog"
      :descr="`${$t('confirmDeleteSelected')} (${selectedIds.length})?`"
      :confirm-text="$t('deleteSelected')"
      :leave-text="$t('cancel')"
      @confirm="confirmDeleteItems"
      @leave="deleteDialog = false"
    />

    <AlertDialog
      :dialog="exportDialog"
      :title="$t('export')"
      :descr="$t('exportChooseColumns')"
      :confirm-text="$t('exportAllFields')"
      :leave-text="$t('cancel')"
      :secondary-confirm-text="$t('exportVisibleColumns')"
      :confirm-loading="exportLoading"
      :on-confirm="onExportConfirmAll"
      :on-leave="() => { exportDialog = false; }"
      :on-secondary-confirm="onExportConfirmVisible"
    />

    <PrintInvoiceDialog
      :dialog="printInvoiceDialog"
      :loading="printInvoiceLoading"
      @close="printInvoiceDialog = false"
      @print="handlePrintInvoice"
    />
  </div>
</template>

<script>
import SideModalDialog from "@/views/components/app/dialog/SideModalDialog.vue";
import PrimaryButton from "@/views/components/app/buttons/PrimaryButton.vue";
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
import storeDataLoaderMixin from "@/mixins/storeDataLoaderMixin";
import exportTableMixin from "@/mixins/exportTableMixin";
import { formatCurrency } from "@/utils/numberUtils";
import { highlightMatches } from "@/utils/searchUtils";
import { TRANSACTION_FORM_PRESETS } from "@/constants/transactionFormPresets";
import KanbanFieldsButton from "@/views/components/app/kanban/KanbanFieldsButton.vue";
import PrintInvoiceDialog from "@/views/components/app/dialog/PrintInvoiceDialog.vue";
import printInvoiceMixin from "@/mixins/printInvoiceMixin";
import kanbanByStatusMixin from "@/mixins/kanbanByStatusMixin";
import OrderFilters from "@/views/components/orders/OrderFilters.vue";
import ViewModeToggle from "@/views/components/app/ViewModeToggle.vue";
import TableSkeleton from "@/views/components/app/TableSkeleton.vue";

const TimelinePanel = defineAsyncComponent(() =>
    import("@/views/components/app/dialog/TimelinePanel.vue")
);
import { getClientDisplayName, getClientDisplayPosition } from '@/utils/displayUtils';
import { formatCashRegisterDisplay } from '@/utils/cashRegisterUtils';

import listQueryMixin from "@/mixins/listQueryMixin";
import { createStoreViewModeMixin } from "@/mixins/storeViewModeMixin";

const ordersViewModeMixin = createStoreViewModeMixin({
    getter: "ordersViewMode",
    dispatch: "setOrdersViewMode",
    modes: ["table", "kanban"],
});

export default {
    components: { SideModalDialog, PrimaryButton, Pagination, DraggableTable, KanbanBoard, OrderCreatePage, InvoiceCreatePage, TransactionCreatePage, BatchButton, AlertDialog, TimelinePanel, OrderPaymentFilter, TableControlsBar, TableFilterButton, KanbanFieldsButton, PrintInvoiceDialog, OrderFilters, ViewModeToggle, TableSkeleton, draggable: VueDraggableNext },
    mixins: [getApiErrorMessage, crudEventMixin, notificationMixin, modalMixin, batchActionsMixin, companyChangeMixin, listQueryMixin, printInvoiceMixin, storeDataLoaderMixin, kanbanByStatusMixin, exportTableMixin, ordersViewModeMixin],
    data() {
        return {
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
                { name: "id", label: "№", size: 20, html: true },
                { name: "statusName", label: 'status', component: markRaw(StatusSelectCell), props: (i) => ({ id: i.id, value: i.statusId, statuses: this.statuses, onChange: (newStatusId) => this.handleChangeStatus([i.id], newStatusId) }), },
                { name: "cashName", label: 'cashRegister' },
                { name: "warehouseName", label: 'warehouse' },
                { name: "dateUser", label: 'dateUser' },
                { name: "client", label: 'client', component: markRaw(ClientButtonCell), props: (i) => ({ client: i.client, searchQuery: this.searchQuery }), },
                { name: "projectName", label: 'project' },
                { name: "products", label: 'products', html: true },
                { name: "paymentStatusText", label: 'paymentStatus', size: 120, html: true },
                { name: "totalPrice", label: 'orderAmount' },
                { name: "description", label: 'description' },
                { name: "note", label: 'note', html: true },
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
            pendingCompletionTransition: null,
            batchStatusId: '',
            kanbanErrorMessage: 'errorGettingOrderList',
            printInvoiceDialog: false,
            printInvoiceLoading: false,
            exportDialog: false,
        };
    },

    computed: {
        searchQuery() {
            return this.$store.state.searchQuery;
        },
        currencySymbol() {
            return this.data?.items?.[0]?.currencySymbol || this.savedCurrencySymbol ;
        },
        orderTransactionFormConfig() {
            return TRANSACTION_FORM_PRESETS.orderPayment;
        },
        isSimpleMode() {
            return this.$route.meta.simpleMode;
        },
        exportPermission() {
            return this.isSimpleMode ? 'orders_simple_export' : 'orders_export';
        },
        itemViewRouteName() {
            // Для simple режима не нужен маршрут, только модалка
            return this.isSimpleMode ? null : 'OrderView';
        },
        baseRouteName() {
            return this.isSimpleMode ? 'SimpleOrders' : 'Orders';
        },
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
    methods: {
        translateOrderStatus,
        getExportParams() {
            return {
                search: this.searchQuery,
                dateFilter: this.dateFilter,
                startDate: this.startDate,
                endDate: this.endDate,
                statusFilter: this.statusFilter,
                projectFilter: this.projectFilter,
                clientFilter: this.clientFilter,
                unpaidOnly: this.paidOrdersFilter,
            };
        },
        handleExport() {
            this.exportDialog = true;
        },
        onExportConfirmAll() {
            this.exportDialog = false;
            this.performExport(null);
        },
        onExportConfirmVisible() {
            this.exportDialog = false;
            this.performExport(this.getVisibleExportColumns());
        },
        getVisibleExportColumns() {
            const key = this.$storageUi.tableColumnsStorageKey(
                'admin.orders',
                this.$store.state.currentCompany?.id
            );
            const saved = localStorage.getItem(key);
            if (!saved) return [];
            try {
                const savedColumns = JSON.parse(saved);
                const map = {
                    id: 'id',
                    statusName: 'status_name',
                    cashName: 'cash_name',
                    warehouseName: 'warehouse_name',
                    dateUser: 'date',
                    client: 'client',
                    projectName: 'project_name',
                    totalPrice: 'total_price',
                    paymentStatusText: 'payment_status_text',
                    note: 'note',
                };
                return savedColumns
                    .filter(col => col.visible && col.name !== 'select')
                    .map(col => map[col.name])
                    .filter(Boolean);
            } catch {
                return [];
            }
        },
        async performExport(columns) {
            if (!this.controller || !this.getExportParams) return;
            this.exportLoading = true;
            try {
                const params = this.getExportParams();
                if (columns && columns.length) params.columns = columns;
                const ids = this.selectedIds?.length ? this.selectedIds : null;
                await this.controller.export(params, ids);
                this.showNotification?.(this.$t('exportDone'), '', false);
            } catch (e) {
                const msg = this.getApiErrorMessage?.(e) ?? e?.message;
                this.showNotification?.(this.$t('exportError'), msg, true);
            } finally {
                this.exportLoading = false;
            }
        },
        onItemClick(item) {
            if (this.isSimpleMode) {
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
                case "id":
                    if (search) {
                        return highlightMatches(String(i.id ?? ""), search);
                    }
                    return i.id;
                case "products":
                    return i.productsHtmlList();
                case "dateUser":
                    return `${i.formatDate()} / ${i.creator?.name || ""}`;
                case "client":
                    if (!i.client) return '<span class="text-gray-500">' + this.$t('notSpecified') + '</span>';
                    const clientName = getClientDisplayName(i.client) || this.$t('notSpecified');
                    const clientPosition = getClientDisplayPosition(i.client);
                    const phone = i.client.phones?.[0]?.phone;
                    const positionPart = clientPosition ? `<div class="text-xs text-gray-500">${clientPosition}</div>` : '';
                    const phonePart = phone ? ` (<span>${phone}</span>)` : '';
                    return positionPart || phonePart ? `<div>${clientName}${positionPart}${phonePart}</div>` : clientName;
                case "statusName":
                    const statusName = i.status?.name || i.statusName ;
                    return statusName ? translateOrderStatus(statusName, this.$t) : '';
                case "paymentStatusText":
                    const paidAmount = parseFloat(i.paidAmount ?? 0) || 0;
                    const totalPrice = parseFloat(i.totalPrice ?? 0) || 0;
                    const normalizedPaymentStatus = ['paid', 'partially_paid', 'unpaid'].includes(i.paymentStatus)
                        ? i.paymentStatus
                        : (paidAmount <= 0
                            ? 'unpaid'
                            : (paidAmount < totalPrice ? 'partially_paid' : 'paid'));
                    const paymentStatusText = i.paymentStatusText || (
                        normalizedPaymentStatus === 'paid'
                            ? this.$t('paid')
                            : normalizedPaymentStatus === 'partially_paid'
                                ? this.$t('partiallyPaid')
                                : this.$t('unpaid')
                    );
                    if (!paymentStatusText) return '';
                    const paymentStatus = normalizedPaymentStatus;
                    const paymentStatusClass = paymentStatus === 'paid'
                        ? 'text-[#5CB85C] font-medium'
                        : paymentStatus === 'partially_paid'
                            ? 'text-[#FFA500] font-medium'
                            : 'text-[#EE4F47] font-medium';
                    const paymentStatusIcon = paymentStatus === 'paid'
                        ? 'fas fa-check-circle'
                        : paymentStatus === 'partially_paid'
                            ? 'fas fa-adjust'
                            : 'fas fa-times-circle';
                    return `<span class="${paymentStatusClass}" title="${paymentStatusText}"><i class="${paymentStatusIcon} mr-1"></i>${paymentStatusText}</span>`;
                case "cashName":
                    return formatCashRegisterDisplay(i.cashName, i.currencySymbol);
                case "warehouseName":
                    return i.warehouse?.name || i.warehouseName || "";
                case "totalPrice":
                    return formatCurrency(i.totalPrice || 0, i.currencySymbol, null, true);
                case "note":
                    if (!i.note) return "";
                    return search ? highlightMatches(i.note, search) : i.note;
                case "description":
                    return i.description || "";
                case "projectName":
                    return i.project?.name || i.projectName || "";

                default:
                    return i[c];
            }
        },

        handlePerPageChange(newPerPage) {
            this.perPage = newPerPage;
            this.fetchItems(1, false);
        },
        async handleCompanyChanged(companyId, previousCompanyId) {
            this.dateFilter = 'all_time';
            this.startDate = null;
            this.endDate = null;
            this.statusFilter = '';
            this.projectFilter = '';
            this.clientFilter = '';
            this.selectedIds = [];
            this.batchStatusId = '';
            this.paidOrdersFilter = false;
            this.resetKanbanPagination();
            await this.fetchItems(1, previousCompanyId == null);
        },
        async fetchItems(page = 1, silent = false) {
            if (this.viewMode === 'kanban') {
                if (page === 1) this.resetKanbanPagination();
                if (!silent) this.loading = true;
                try {
                    await this.fetchKanbanInitial();
                } catch (error) {
                    this.showNotification(this.$t('errorGettingOrderList'), error.message, true);
                }
                if (!silent) this.loading = false;
                return;
            }

            if (!silent) this.loading = true;
            try {
                const response = await OrderController.getItems(
                    page,
                    this.searchQuery,
                    this.dateFilter,
                    this.startDate,
                    this.endDate,
                    this.statusFilter,
                    this.projectFilter,
                    this.clientFilter,
                    this.perPage,
                    this.paidOrdersFilter
                );
                this.data = response;
                this.unpaidOrdersTotal = response.unpaidOrdersTotal || 0;
                if (response.items?.[0]?.currencySymbol) {
                    this.savedCurrencySymbol = response.items[0].currencySymbol;
                }
            } catch (error) {
                this.showNotification(this.$t('errorGettingOrderList'), error.message, true);
            }
            if (!silent) this.loading = false;
        },
        ensureKanbanStatuses() {
            return this.fetchStatuses();
        },
        async fetchKanbanStatusPage(statusId, page) {
            return OrderController.getItems(page, this.searchQuery, this.dateFilter, this.startDate, this.endDate, statusId, this.projectFilter, this.clientFilter, this.kanbanFetchPerPage, this.paidOrdersFilter);
        },
        afterFetchKanbanInitial(responses) {
            const first = responses[0]?.items?.[0];
            if (first?.currencySymbol) this.savedCurrencySymbol = first.currencySymbol;
        },
        refreshTimelineIfVisible() {
            if (this.$refs.timelinePanel && !this.timelineCollapsed) {
                this.$refs.timelinePanel.refreshTimeline();
            }
        },
        handleSavedSilent() {
            this.showNotification(this.$t('orderSaved'), "", false);
            this.fetchItems(this.data?.currentPage ?? 1, true);
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
                const result = await OrderController.batchUpdateStatus({ ids, statusId });
                if (result && result.needs_payment) {
                    this.showPaymentModal(result, statusId);
                    this.loading = false;
                    return;
                }

                await this.fetchItems(this.data?.currentPage ?? 1, true);
                this.showNotification(this.$t('statusUpdated'), "", false);

                if (this.editingItem && ids.includes(this.editingItem.id)) {
                    this.refreshTimelineIfVisible();
                }
            } catch (e) {
                if (e.response?.status === 422 && e.response.data?.needs_payment) {
                    this.showPaymentModal(e.response.data, statusId);
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
        showPaymentModal(paymentData, targetStatusId = null) {
            const order = this.getCurrentItems().find(item => item.id === paymentData.order_id);
            if (order) {
                this.showNotification(
                    this.$t('orderNeedsPayment'),
                    `${this.$t('remainingAmount')}: ${paymentData.remaining_amount} ${order.currencySymbol }`,
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
                if (targetStatusId) {
                    this.pendingCompletionTransition = {
                        orderId: order.id,
                        statusId: targetStatusId,
                        orderTotal: paymentData.order_total,
                    };
                }
                this.transactionModal = true;
            }
        },
        closeTransactionModal() {
            this.transactionModal = false;
            this.editingTransaction = null;
            this.pendingCompletionTransition = null;
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
                { value: this.dateFilter === 'custom' ? this.startDate : null, defaultValue: null },
                { value: this.dateFilter === 'custom' ? this.endDate : null, defaultValue: null }
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
                this.showNotification(this.$t('error'), this.$t('errorGeneratingPdf'), true);
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

        async handleTransactionSaved() {
            this.showNotification(this.$t('success'), this.$t('transactionSaved'), false);
            const pendingTransition = this.pendingCompletionTransition;
            this.transactionModal = false;
            this.editingTransaction = null;
            this.pendingCompletionTransition = null;

            if (pendingTransition) {
                await this.tryCompletePendingStatusTransition(pendingTransition);
            }
            this.fetchItems(this.data?.currentPage ?? 1, true);
        },
        async tryCompletePendingStatusTransition(pendingTransition) {
            try {
                const paid = await TransactionController.getTotalPaidByOrderId(pendingTransition.orderId);
                const totalPaid = parseFloat(paid?.total) || 0;
                const orderTotal = parseFloat(pendingTransition.orderTotal) || 0;

                if (orderTotal <= 0 || totalPaid < orderTotal) {
                    return;
                }

                await OrderController.batchUpdateStatus({
                    ids: [pendingTransition.orderId],
                    statusId: pendingTransition.statusId,
                });
                this.showNotification(this.$t('statusUpdated'), "", false);
            } catch (error) {
                const errors = this.getApiErrorMessage(error);
                this.showNotification(this.$t('errorChangingStatus'), errors.join("\n"), true);
            }
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
            this.fetchItems(this.data?.currentPage ?? 1, true);
        },

        handleTransactionViewDeleted() {
            this.viewTransactionModal = false;
            this.editingTransactionItem = null;
            this.refreshTimelineIfVisible();
            this.fetchItems(this.data?.currentPage ?? 1, true);
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
                        projectId: updateData.projectId
                    }).then(() => {
                        this.showNotification(this.$t('success'), this.$t('orderUpdated'), false);
                    }).catch(error => {
                        const errors = this.getApiErrorMessage(error);
                        this.showNotification(this.$t('error'), errors.join("\n"), true);
                        this.fetchItems(this.data?.currentPage ?? 1, true);
                    });
                }
            } catch (error) {
                const errors = this.getApiErrorMessage(error);
                this.showNotification(this.$t('error'), errors.join("\n"), true);
                this.fetchItems(this.data?.currentPage ?? 1, true);
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
                    statusId
                }).then(() => {
                    if (this.editingItem && orderIds.includes(this.editingItem.id)) {
                        this.refreshTimelineIfVisible();
                    }
                }).catch(error => {
                    if (error.response?.status === 422 && error.response.data?.needs_payment) {
                        this.showPaymentModal(error.response.data, statusId);
                    } else {
                        const errors = this.getApiErrorMessage(error);
                        this.showNotification(this.$t('error'), errors.join("\n"), true);
                        this.fetchItems(this.data?.currentPage ?? 1, true);
                    }
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
        },
        viewMode: {
            handler(newMode) {
                this.loading = true;
                if (newMode === 'kanban') {
                    this.resetKanbanPagination();
                    this.$nextTick(() => {
                        this.fetchItems(1, false);
                    });
                } else {
                    this.resetKanbanPagination();
                    this.$nextTick(() => {
                        this.fetchItems(1, false);
                    });
                }
            },
            immediate: false
        }
    },
    mounted() {
        if (!this.$store.getters.projects?.length) {
            this.$store.dispatch('loadProjects');
        }
        if (this.viewMode === 'kanban') {
            this.resetKanbanPagination();
        } else {
            this.fetchItems();
        }
    }
};
</script>

<style scoped>
.kanban-view-container {
    width: 100%;
    height: calc(100vh - 200px);
    min-height: 400px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.kanban-view-container .kanban-board-area {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}
</style>