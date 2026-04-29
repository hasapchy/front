<template>
  <div class="flex min-h-0 min-w-0 flex-1 flex-col">
    <transition
      name="fade"
      mode="out-in"
    >
      <CardListViewShell
        v-if="isDataReady && (displayViewMode === 'table' || displayViewMode === 'cards')"
        :key="cardListShellKey"
        :display-view-mode="displayViewMode"
        :cards-toolbar="cardsToolbar"
      >
        <template #table>
        <DraggableTable
          table-key="admin.orders"
          :columns-config="columnsConfig"
          :table-data="data.items"
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
              :export-permission="exportPermission"
              :on-export="handleExport"
              :export-loading="exportLoading"
              :show-pagination="true"
              :pagination-data="paginationData"
              :on-page-change="fetchItems"
              :on-per-page-change="handlePerPageChange"
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
                  :category-filter="categoryFilter"
                  :statuses="statuses"
                  :projects="projects"
                  :clients="clients"
                  :categories="categories"
                  :has-active-filters="hasActiveFilters"
                  :active-filters-count="getActiveFiltersCount()"
                  @update:date-filter="dateFilter = $event"
                  @update:start-date="startDate = $event"
                  @update:end-date="endDate = $event"
                  @update:status-filter="statusFilter = $event"
                  @update:project-filter="projectFilter = $event"
                  @update:client-filter="clientFilter = $event"
                  @update:category-filter="categoryFilter = $event"
                  @reset="resetFilters"
                  @apply="applyFilters"
                />

                <ViewModeToggle
                  :view-mode="displayViewMode"
                  :show-kanban="true"
                  :show-cards="true"
                  @change="changeViewMode"
                />

                <OrderPaymentFilter
                  v-model="paidOrdersFilter"
                  :orders="orderRows"
                  :status-id="4"
                  :currency-symbol="currencySymbol"
                  :unpaid-orders-total="unpaidOrdersTotal"
                  @change="handlePaidOrdersFilterChange"
                />
              </template>

              <template #gear="{ resetColumns, columns, toggleVisible, log }">
                <TableFilterButton
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
                        class="flex items-center hover:bg-gray-100 dark:hover:bg-[var(--surface-muted)] p-2 rounded"
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
            </TableControlsBar>
          </template>
        </DraggableTable>
        </template>
        <template #card-bar-left>
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
            :category-filter="categoryFilter"
            :statuses="statuses"
            :projects="projects"
            :clients="clients"
            :categories="categories"
            :has-active-filters="hasActiveFilters"
            :active-filters-count="getActiveFiltersCount()"
            @update:date-filter="dateFilter = $event"
            @update:start-date="startDate = $event"
            @update:end-date="endDate = $event"
            @update:status-filter="statusFilter = $event"
            @update:project-filter="projectFilter = $event"
            @update:client-filter="clientFilter = $event"
            @update:category-filter="categoryFilter = $event"
            @reset="resetFilters"
            @apply="applyFilters"
          />
          <ViewModeToggle
            :view-mode="displayViewMode"
            :show-kanban="true"
            :show-cards="true"
            @change="changeViewMode"
          />
        </template>
        <template #card-bar-right-before>
          <OrderPaymentFilter
            v-model="paidOrdersFilter"
            :orders="orderRows"
            :status-id="4"
            :currency-symbol="currencySymbol"
            :unpaid-orders-total="unpaidOrdersTotal"
            @change="handlePaidOrdersFilterChange"
          />
        </template>
        <template #card-bar-right-after>
          <KanbanFieldsButton mode="orders" />
        </template>
        <template #card-bar-gear />
        <template #cards>
          <MapperCardGrid
            class="mt-4"
            :items="orderRows"
            :card-config="orderCardConfig"
            :card-mapper="orderCardMapper"
            title-field="idCard"
            header-suffix-field="dateUser"
            :selected-ids="selectedIds"
            :show-checkbox="$store.getters.hasPermission('orders_delete')"
            @dblclick="onItemClick"
            @select-toggle="toggleSelectRow"
          />
        </template>
      </CardListViewShell>

      <div
        v-else-if="displayViewMode === 'kanban'"
        key="kanban-view"
        class="kanban-view-container"
      >
        <TableControlsBar
          :show-filters="true"
          :has-active-filters="hasActiveFilters"
          :active-filters-count="getActiveFiltersCount()"
          :on-filters-reset="resetFilters"
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
              :category-filter="categoryFilter"
              :statuses="statuses"
              :projects="projects"
              :clients="clients"
              :categories="categories"
              :has-active-filters="hasActiveFilters"
              :active-filters-count="getActiveFiltersCount()"
              @update:date-filter="dateFilter = $event"
              @update:start-date="startDate = $event"
              @update:end-date="endDate = $event"
              @update:status-filter="statusFilter = $event"
              @update:project-filter="projectFilter = $event"
              @update:client-filter="clientFilter = $event"
              @update:category-filter="categoryFilter = $event"
              @reset="resetFilters"
              @apply="applyFilters"
            />

            <ViewModeToggle
              :view-mode="displayViewMode"
              :show-kanban="true"
              :show-cards="true"
              @change="changeViewMode"
            />
          </template>
          <template #right-after>
            <KanbanFieldsButton mode="orders" />
          </template>
        </TableControlsBar>

        <div class="kanban-board-area">
          <KanbanBoard
            :orders="allKanbanItems"
            :statuses="statuses"
            :selected-ids="selectedIds"
            :loading="loading"
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
        <CardsSkeleton v-if="displayViewMode === 'cards'" />
        <TableSkeleton v-else />
      </div>
    </transition>

    <SideModalDialog
      :show-form="modalDialog"
      :title="sideModalCrudTitle('sideModalGenOrder', 'sideModalNomOrder')"
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
      :title="sideModalCrudTitle('sideModalGenInvoice', 'sideModalNomInvoice', null)"
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
      :title="viewTransactionSideTitle"
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
      :title="sideModalCrudTitle('sideModalGenTransaction', 'sideModalNomTransaction', null)"
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
import SideModalDialog, { transactionSideModalTitle } from "@/views/components/app/dialog/SideModalDialog.vue";
import PrimaryButton from "@/views/components/app/buttons/PrimaryButton.vue";
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';
import DraggableTable from "@/views/components/app/forms/DraggableTable.vue";
import KanbanBoard from "@/views/components/app/kanban/KanbanBoard.vue";
import CardListViewShell from '@/views/components/app/cards/CardListViewShell.vue';
import MapperCardGrid from '@/views/components/app/cards/MapperCardGrid.vue';
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
import { eventBus } from "@/eventBus";
import { TimelinePanelAsync } from '@/utils/timelinePanelAsync';
import timelineSideModalMixin from '@/mixins/timelineSideModalMixin';
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
import CardsSkeleton from "@/views/components/app/CardsSkeleton.vue";
import { getClientDisplayName, getClientDisplayPosition } from '@/utils/displayUtils';
import { formatCashRegisterDisplay } from '@/utils/cashRegisterUtils';

import listQueryMixin from "@/mixins/listQueryMixin";
import { createStoreViewModeMixin } from "@/mixins/storeViewModeMixin";

const ordersViewModeMixin = createStoreViewModeMixin({
    getter: "ordersViewMode",
    dispatch: "setOrdersViewMode",
    modes: ["table", "kanban", "cards"],
});

export default {
    components: { SideModalDialog, PrimaryButton, DraggableTable, KanbanBoard, CardListViewShell, MapperCardGrid, OrderCreatePage, InvoiceCreatePage, TransactionCreatePage, BatchButton, AlertDialog, TimelinePanel: TimelinePanelAsync, OrderPaymentFilter, TableControlsBar, TableFilterButton, KanbanFieldsButton, PrintInvoiceDialog, OrderFilters, ViewModeToggle, TableSkeleton, CardsSkeleton, draggable: VueDraggableNext },
    mixins: [getApiErrorMessage, crudEventMixin, notificationMixin, modalMixin, batchActionsMixin, companyChangeMixin, listQueryMixin, printInvoiceMixin, storeDataLoaderMixin, kanbanByStatusMixin, exportTableMixin, ordersViewModeMixin, timelineSideModalMixin],
    data() {
        return {
            statuses: [],
            projects: [],
            clients: [],
            categories: [],
            showBatchStatusSelect: false,
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
            categoryFilter: '',
            paidOrdersFilter: false,
            unpaidOrdersTotal: 0,
            transactionModal: false,
            editingTransaction: null,
            viewTransactionModal: false,
            editingTransactionItem: null,
            savedCurrencySymbol: '',
            pendingStatusUpdates: new Map(),
            pendingCompletionTransition: null,
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
        isDataReady() {
            return this.data != null && !this.loading;
        },
        paginationData() {
            if (!this.data) return null;
            return {
                currentPage: this.data.currentPage,
                lastPage: this.data.lastPage,
                perPage: this.perPage,
                perPageOptions: this.perPageOptions
            };
        },
        cardsToolbar() {
            return {
                showFilters: true,
                hasActiveFilters: this.hasActiveFilters,
                activeFiltersCount: this.getActiveFiltersCount(),
                onFiltersReset: this.resetFilters,
                exportPermission: this.exportPermission,
                onExport: this.handleExport,
                exportLoading: this.exportLoading,
                showPagination: true,
                paginationData: this.paginationData,
                onPageChange: this.fetchItems,
                onPerPageChange: this.handlePerPageChange,
            };
        },
        orderRows() {
            return this.data?.items ?? [];
        },
        currencySymbol() {
            return this.data?.items?.[0]?.currencySymbol || this.savedCurrencySymbol ;
        },
        orderTransactionFormConfig() {
            return TRANSACTION_FORM_PRESETS.orderPayment;
        },
        isSimpleOrdersRoute() {
            return this.$route.meta.simpleMode;
        },
        exportPermission() {
            return this.isSimpleOrdersRoute ? 'orders_simple_export' : 'orders_export';
        },
        itemViewRouteName() {
            return this.isSimpleOrdersRoute ? null : 'OrderView';
        },
        baseRouteName() {
            return this.isSimpleOrdersRoute ? 'SimpleOrders' : 'Orders';
        },
        viewTransactionSideTitle() {
            if (!this.viewTransactionModal) {
                return '';
            }
            return transactionSideModalTitle(this.$t.bind(this), { editingItem: this.editingTransactionItem });
        },
        orderCardConfig() {
            return [
                { name: 'client', icon: 'fas fa-user', html: true },
                { name: 'projectName', icon: 'fas fa-folder' },
                { name: 'products', icon: 'fas fa-box', html: true },
                { name: 'note', icon: 'fas fa-sticky-note', html: true },
                { name: 'totalPriceWithPaymentStatus', slot: 'footer', html: true },
            ];
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
                categoryFilter: this.categoryFilter,
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
            if (this.isSimpleOrdersRoute) {
                if (!item?.id) {
                    return;
                }
                this.showModal(item);
                return;
            }
            // Для обычного режима - стандартная логика из modalMixin
            return modalMixin.methods.onItemClick.call(this, item);
        },
        orderCardMapper(item, field) {
            if (field === 'idCard') {
                return `№${item.id}`;
            }
            if (field === 'totalPriceWithPaymentStatus') {
                const total = this.itemMapper(item, 'totalPrice');
                const payment = this.itemMapper(item, 'paymentStatusText');
                if (!payment) {
                    return total;
                }
                return `<span class="inline-flex w-full min-w-0 items-center justify-between gap-2"><span class="min-w-0 shrink">${payment}</span><span class="shrink-0 text-right text-sm font-bold text-[var(--nav-accent)] dark:text-white">${total}</span></span>`;
            }
            return this.itemMapper(item, field);
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
                case "client": {
                    if (!i.client) return '<span class="text-gray-500">' + this.$t('notSpecified') + '</span>';
                    const clientName = getClientDisplayName(i.client) || this.$t('notSpecified');
                    const clientPosition = getClientDisplayPosition(i.client);
                    const phone = i.client.phones?.[0]?.phone;
                    const positionPart = clientPosition ? `<div class="text-xs text-gray-500">${clientPosition}</div>` : '';
                    const phonePart = phone ? ` (<span>${phone}</span>)` : '';
                    return positionPart || phonePart ? `<div>${clientName}${positionPart}${phonePart}</div>` : clientName;
                }
                case "statusName": {
                    const statusName = i.status?.name || i.statusName ;
                    return statusName ? translateOrderStatus(statusName, this.$t) : '';
                }
                case "paymentStatusText": {
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
                }
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
            this.categoryFilter = '';
            this.selectedIds = [];
            this.paidOrdersFilter = false;
            this.resetKanbanPagination();
            await this.fetchItems(1, previousCompanyId == null);
        },
        async fetchItems(page = 1, silent = false) {
            if (this.displayViewMode === 'kanban') {
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
                    this.categoryFilter,
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
            return OrderController.getItems(
                page,
                this.searchQuery,
                this.dateFilter,
                this.startDate,
                this.endDate,
                statusId,
                this.projectFilter,
                this.clientFilter,
                this.categoryFilter,
                this.kanbanFetchPerPage,
                this.paidOrdersFilter
            );
        },
        afterFetchKanbanInitial(responses) {
            const first = responses[0]?.items?.[0];
            if (first?.currencySymbol) this.savedCurrencySymbol = first.currencySymbol;
        },
        handleSavedSilent() {
            this.showNotification(this.$t('orderSaved'), "", false);
            this.fetchItems(this.data?.currentPage ?? 1, true);
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
        async fetchCategories() {
            await this.loadStoreData({
                getterName: 'categories',
                dispatchName: 'loadCategories',
                localProperty: 'categories',
                // Используем тот же набор, что и в `OrderCreatePage` при выборе категории товара.
                transform: (categories) => categories.filter(c => !c.parentId),
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
            return this.displayViewMode === 'kanban' ? this.allKanbanItems : (this.data?.items || []);
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

        showModal(item = null) {
            this.resetTimelineSidebar();
            modalMixin.methods.showModal.call(this, item);
        },
        closeModal(skipScrollRestore = false) {
            modalMixin.methods.closeModal.call(this, skipScrollRestore);
            if (this.$route.params.id) {
                this.$router.replace({ name: 'Orders' });
            }
            this.editingItem = null;
            this.resetTimelineSidebar();
        },
        resetFilters() {
            this.resetFiltersFromConfig({
                dateFilter: 'all_time',
                startDate: null,
                endDate: null,
                statusFilter: '',
                projectFilter: '',
                clientFilter: '',
                categoryFilter: '',
                paidOrdersFilter: false
            });
        },
        getActiveFiltersCount() {
            return this.getActiveFiltersCountFromConfig([
                { value: this.dateFilter, defaultValue: 'all_time' },
                { value: this.statusFilter, defaultValue: '' },
                { value: this.projectFilter, defaultValue: '' },
                { value: this.clientFilter, defaultValue: '' },
                { value: this.categoryFilter, defaultValue: '' },
                { value: this.paidOrdersFilter, defaultValue: false },
                { value: this.dateFilter === 'custom' ? this.startDate : null, defaultValue: null },
                { value: this.dateFilter === 'custom' ? this.endDate : null, defaultValue: null }
            ]);
        },
        handlePaidOrdersFilterChange(isActive) {
            this.paidOrdersFilter = isActive;
            if (this.displayViewMode === 'kanban') {
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
                    console.log('[OrdersKanban] handleOrderMoved', updateData, {
                        currentItemsLen: this.getCurrentItems().length,
                    });
                    const order = this.getCurrentItems().find(o => Number(o.id) === Number(updateData.orderId));
                    console.log('[OrdersKanban] order resolved', !!order, order?.id, order?.statusId);
                    if (order) {
                        order.statusId = updateData.statusId != null ? Number(updateData.statusId) : updateData.statusId;
                        const status = this.statuses.find(s => Number(s.id) === Number(updateData.statusId));
                        if (status) {
                            order.status = status;
                            order.statusName = translateOrderStatus(status.name, this.$t);
                        }
                    }

                    this.pendingStatusUpdates.set(updateData.orderId, updateData.statusId);
                    this.syncKanbanOrdersStable();
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

    },
    watch: {
        /** Категории привязаны к компании: первая загрузка и смена id без пропуска (раньше created() мог вызывать load до currentCompany). */
        currentCompanyId: {
            async handler(id) {
                if (id) {
                    await this.fetchCategories();
                } else {
                    this.categories = [];
                }
            },
            immediate: true,
        },
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
        displayViewMode: {
            handler(newMode, oldMode) {
                if (oldMode === undefined) {
                    return;
                }
                this.loading = true;
                this.resetKanbanPagination();
                this.$nextTick(() => {
                    this.fetchItems(1, false);
                });
            },
            immediate: false
        }
    },
    mounted() {
        if (!this.$store.getters.projects?.length) {
            this.$store.dispatch('loadProjects');
        }
        this.fetchItems();
    }
};
</script>

<style scoped>
.kanban-view-container {
    width: 100%;
    flex: 1;
    min-height: 0;
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