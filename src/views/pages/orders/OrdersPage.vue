<template>
    <div class="layout-flex-fill-col">
        <transition name="fade" mode="out-in">
            <CardListViewShell v-if="isDataReady && (displayViewMode === 'table' || displayViewMode === 'cards')"
                :key="cardListShellKey" :display-view-mode="displayViewMode" :cards-toolbar="cardsToolbar">
                <template #table>
                    <DraggableTable table-key="admin.orders" :columns-config="columnsConfig" :table-data="data.items"
                        :item-mapper="itemMapper" :on-item-click="onItemClick" @selection-change="selectedIds = $event">
                        <template #tableControlsBar="{ resetColumns, columns, toggleVisible, log }">
                            <TableControlsBar :show-pagination="true" :pagination-data="paginationData"
                                :on-page-change="refetchList" :on-per-page-change="handlePerPageChange"
                                :reset-columns="resetColumns" :columns="columns" :toggle-visible="toggleVisible"
                                :log="log">
                                <template #left>
                                    <PrimaryButton :onclick="() => showModal(null)" icon="fas fa-plus"
                                        :disabled="!$store.getters.hasPermission('orders_create')"
                                        :aria-label="$t('create')" />
                                    <PrimaryButton v-if="$store.getters.hasPermission(exportPermission)"
                                        icon="fas fa-file-excel" :onclick="handleExport" :disabled="exportLoading"
                                        :aria-label="$t('export')" />
                                    <transition name="fade">
                                        <BatchButton v-if="selectedIds.length" :selected-ids="selectedIds"
                                            :batch-actions="getBatchActions()"
                                            :show-batch-status-select="showBatchStatusSelect" :statuses="statuses"
                                            :handle-change-status="handleChangeStatus" :show-status-select="true" />
                                    </transition>
                                    <ViewModeToggle :view-mode="displayViewMode" :show-kanban="true" :show-cards="true"
                                        @change="changeViewMode" />
                                </template>
                                <template #filters-desktop>
                                    <OrderFilters :date-filter="dateFilter" :start-date="startDate" :end-date="endDate"
                                        :status-filter="statusFilter" :project-filter="projectFilter"
                                        :client-filter="clientFilter" :category-filter="categoryFilter"
                                        :statuses="statuses" :projects="projects" :clients="clients"
                                        :categories="categories" :has-active-filters="hasActiveFilters"
                                        :active-filters-count="getActiveFiltersCount()"
                                        @update:date-filter="dateFilter = $event"
                                        @update:start-date="startDate = $event" @update:end-date="endDate = $event"
                                        @update:status-filter="statusFilter = $event"
                                        @update:project-filter="projectFilter = $event"
                                        @update:client-filter="clientFilter = $event"
                                        @update:category-filter="categoryFilter = $event" @reset="resetFilters"
                                        @apply="applyFilters" />
                                </template>
                                <template #gear="{ resetColumns, columns, toggleVisible, log }">
                                    <TableFilterButton v-if="columns && columns.length" :on-reset="resetColumns">
                                        <ul>
                                            <draggable v-if="columns.length" class="dragArea list-group w-full"
                                                :list="columns" @change="log">
                                                <li v-for="(element, index) in columns"
                                                    v-show="element.name !== 'select'" :key="element.name"
                                                    class="flex items-center hover:bg-gray-100 dark:hover:bg-[var(--surface-muted)] p-2 rounded"
                                                    @click="toggleVisible(index)">
                                                    <div
                                                        class="space-x-2 flex flex-row justify-between w-full select-none">
                                                        <div>
                                                            <i class="text-sm mr-2 text-[var(--color-info)]"
                                                                :class="[element.visible ? 'fas fa-circle-check' : 'far fa-circle']" />
                                                            {{ $te(element.label) ? $t(element.label) : element.label }}
                                                        </div>
                                                        <div>
                                                            <i
                                                                class="fas fa-grip-vertical text-gray-300 text-sm cursor-grab" />
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
                    <PrimaryButton :onclick="() => showModal(null)" icon="fas fa-plus"
                        :disabled="!$store.getters.hasPermission('orders_create')" :aria-label="$t('create')" />
                    <PrimaryButton v-if="$store.getters.hasPermission(exportPermission)" icon="fas fa-file-excel"
                        :onclick="handleExport" :disabled="exportLoading" :aria-label="$t('export')" />
                    <transition name="fade">
                        <BatchButton v-if="selectedIds.length" :selected-ids="selectedIds"
                            :batch-actions="getBatchActions()" :show-batch-status-select="showBatchStatusSelect"
                            :statuses="statuses" :handle-change-status="handleChangeStatus"
                            :show-status-select="true" />
                    </transition>
                    <ViewModeToggle :view-mode="displayViewMode" :show-kanban="true" :show-cards="true"
                        @change="changeViewMode" />
                </template>
                <template #card-bar-filters-desktop>
                    <OrderFilters :date-filter="dateFilter" :start-date="startDate" :end-date="endDate"
                        :status-filter="statusFilter" :project-filter="projectFilter" :client-filter="clientFilter"
                        :category-filter="categoryFilter" :statuses="statuses" :projects="projects" :clients="clients"
                        :categories="categories" :has-active-filters="hasActiveFilters"
                        :active-filters-count="getActiveFiltersCount()" @update:date-filter="dateFilter = $event"
                        @update:start-date="startDate = $event" @update:end-date="endDate = $event"
                        @update:status-filter="statusFilter = $event" @update:project-filter="projectFilter = $event"
                        @update:client-filter="clientFilter = $event" @update:category-filter="categoryFilter = $event"
                        @reset="resetFilters" @apply="applyFilters" />
                </template>
                <template #card-bar-gear>
                    <CardFieldsGearMenu
                        :card-fields="cardFields"
                        :on-reset="resetCardFields"
                        @toggle="toggleCardFieldVisible"
                    />
                </template>
                <template #cards>
                    <MapperCardGrid class="mt-4" :items="data.items" :card-config="cardFields"
                        :card-mapper="orderCardMapper" card-layout="entity" title-field="clientTitle"
                        title-subtitle-field="idCard" :entity="orderEntityCard" :selected-ids="selectedIds"
                        :show-checkbox="$store.getters.hasPermission('orders_delete')" @dblclick="onItemClick"
                        @select-toggle="toggleSelectRow" />
                </template>
            </CardListViewShell>

            <div v-else-if="displayViewMode === 'kanban'" key="kanban-view" class="kanban-view-container">
                <TableControlsBar :show-pagination="false">
                    <template #left>
                        <PrimaryButton :onclick="() => showModal(null)" icon="fas fa-plus"
                            :disabled="!$store.getters.hasPermission('orders_create')" :aria-label="$t('create')" />
                        <PrimaryButton v-if="$store.getters.hasPermission(exportPermission)" icon="fas fa-file-excel"
                            :onclick="handleExport" :disabled="exportLoading" :aria-label="$t('export')" />
                        <transition name="fade">
                            <BatchButton v-if="selectedIds.length" :selected-ids="selectedIds"
                                :batch-actions="getBatchActions()" :show-batch-status-select="showBatchStatusSelect"
                                :statuses="statuses" :handle-change-status="handleChangeStatus"
                                :show-status-select="true" />
                        </transition>
                        <ViewModeToggle :view-mode="displayViewMode" :show-kanban="true" :show-cards="true"
                            @change="changeViewMode" />
                    </template>
                    <template #filters-desktop>
                        <OrderFilters :date-filter="dateFilter" :start-date="startDate" :end-date="endDate"
                            :status-filter="statusFilter" :project-filter="projectFilter" :client-filter="clientFilter"
                            :category-filter="categoryFilter" :statuses="statuses" :projects="projects"
                            :clients="clients" :categories="categories" :has-active-filters="hasActiveFilters"
                            :active-filters-count="getActiveFiltersCount()" @update:date-filter="dateFilter = $event"
                            @update:start-date="startDate = $event" @update:end-date="endDate = $event"
                            @update:status-filter="statusFilter = $event"
                            @update:project-filter="projectFilter = $event"
                            @update:client-filter="clientFilter = $event"
                            @update:category-filter="categoryFilter = $event" @reset="resetFilters"
                            @apply="applyFilters" />
                    </template>
                    <template #right-after>
                        <CardFieldsGearMenu
                            :card-fields="cardFields.filter((field) => field.name !== 'statusName')"
                            :on-reset="resetCardFields"
                            @toggle="toggleCardFieldVisible"
                        />
                    </template>
                </TableControlsBar>
                <div class="kanban-board-area">
                    <KanbanBoard :orders="allKanbanItems" :statuses="statuses" :selected-ids="selectedIds"
                        :loading="kanbanBoardLoading" :entity-card="orderKanbanEntityCard"
                        :status-meta="kanbanByStatus" @order-moved="handleOrderMoved"
                        @card-dblclick="onItemClick" @card-select-toggle="toggleSelectRow"
                        @column-select-toggle="handleColumnSelectToggle" @load-more="loadMoreKanbanItems($event)" />
                </div>
            </div>

            <div v-else key="loader" class="min-h-64">
                <CardsSkeleton v-if="displayViewMode === 'cards'" layout="entity" />
                <TableSkeleton v-else />
            </div>
        </transition>

        <SideModalDialog :show-form="modalDialog" :title="sideModalCrudTitle('sideModalGenOrder', 'sideModalNomOrder')"
            :onclose="handleModalClose" :timeline-collapsed="timelineCollapsed" :show-timeline-button="!!editingItem"
            @toggle-timeline="toggleTimeline">
            <OrderCreatePage v-if="modalDialog" :key="editingItem ? editingItem.id : 'new-order'"
                ref="ordercreatepageForm" :editing-item="editingItem" @saved="handleSaved"
                @saved-silent="handleSavedSilent" @saved-error="handleSavedError" @deleted="handleDeleted"
                @deleted-error="handleDeletedError" @close-request="closeModal"
                @create-invoice="createInvoiceFromOrder" />

            <template #timeline>
                <TimelinePanel v-if="editingItem && !timelineCollapsed" :id="editingItem.id" ref="timelinePanel"
                    :type="'order'" @toggle-timeline="toggleTimeline" @open-transaction="openTransactionFromTimeline" />
            </template>
        </SideModalDialog>

        <SideModalDialog :show-form="invoiceModalDialog"
            :title="sideModalCrudTitle('sideModalGenInvoice', 'sideModalNomInvoice', null)"
            :onclose="handleInvoiceModalClose">
            <InvoiceCreatePage v-if="invoiceModalDialog" ref="invoiceCreateForm"
                :preselected-order-ids="invoicePreselectedOrderIds" @saved="handleInvoiceSaved"
                @saved-error="handleInvoiceSavedError" @close-request="closeInvoiceModal" />
        </SideModalDialog>

        <SideModalDialog :show-form="viewTransactionModal" :title="viewTransactionSideTitle"
            :onclose="() => { viewTransactionModal = false; editingTransactionItem = null; }">
            <TransactionCreatePage v-if="viewTransactionModal" :editing-item="editingTransactionItem"
                :form-config="transactionViewFormConfig" @saved="handleTransactionViewSaved"
                @saved-error="handleTransactionSavedError" @deleted="handleTransactionViewDeleted"
                @deleted-error="handleTransactionSavedError"
                @close-request="() => { viewTransactionModal = false; editingTransactionItem = null; }" />
        </SideModalDialog>

        <SideModalDialog :show-form="transactionModal"
            :title="sideModalCrudTitle('sideModalGenTransaction', 'sideModalNomTransaction', null)"
            :onclose="closeTransactionModal">
            <TransactionCreatePage v-if="editingTransaction" :editing-item="null"
                :initial-client="editingTransaction.client" :initial-project-id="editingTransaction.projectId"
                :order-id="editingTransaction.orderId" :document-balance-id="editingTransaction.documentBalanceId"
                :default-cash-id="editingTransaction.cashId" :client-balances="editingTransaction.clientBalances || []"
                :prefill-amount="editingTransaction.prefillAmount"
                :prefill-currency-id="editingTransaction.prefillCurrencyId" :form-config="orderTransactionFormConfig"
                @saved="handleTransactionSaved" @saved-error="handleTransactionSavedError"
                @close-request="closeTransactionModal" />
        </SideModalDialog>

        <AlertDialog :dialog="deleteDialog" :descr="`${$t('confirmDeleteSelected')} (${selectedIds.length})?`"
            :confirm-text="$t('deleteSelected')" :leave-text="$t('cancel')" @confirm="confirmDeleteItems"
            @leave="deleteDialog = false" />

        <AlertDialog :dialog="exportDialog" :title="$t('export')" :descr="$t('exportChooseColumns')"
            :confirm-text="$t('exportAllFields')" :leave-text="$t('cancel')"
            :secondary-confirm-text="$t('exportVisibleColumns')" :confirm-loading="exportLoading"
            :on-confirm="onExportConfirmAll" :on-leave="() => { exportDialog = false; }"
            :on-secondary-confirm="onExportConfirmVisible" />

        <PrintInvoiceDialog :dialog="printInvoiceDialog" :loading="printInvoiceLoading"
            @close="printInvoiceDialog = false" @print="handlePrintInvoice" />
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
import DateUserCell from '@/views/components/app/buttons/DateUserCell.vue';
import ProductsListCell from "@/views/components/app/buttons/ProductsListCell.vue";
import { buildDateUserCellProps } from '@/utils/userCellUtils';
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
import StatusSelectCell from "@/views/components/app/buttons/StatusSelectCell.vue";
import debounce from "lodash.debounce";
import companyChangeMixin from "@/mixins/companyChangeMixin";
import storeDataLoaderMixin from "@/mixins/storeDataLoaderMixin";
import exportTableMixin from "@/mixins/exportTableMixin";
import { highlightMatches } from "@/utils/searchUtils";
import { TRANSACTION_FORM_PRESETS } from "@/constants/transactionFormPresets";
import { balancesForDocumentPayment } from '@/utils/documentPaymentBalanceUtils';
import { buildPaymentStatusHtml } from '@/utils/paymentStatusCell';
import {
    createEntityCardOptions,
    createEntityStatusPillForItem,
    ENTITY_CHIP_ICON,
    entityChip,
    entityFooterAmount,
    entityFooterDate,
    entityFooterPayment,
    entityFooterStatus,
    entityHeroFull,
    entityMeta,
    entityTitleMeta,
    mapEntityIdSubtitle,
    mapEntityProductsLine,
    mapEntityProjectChip,
    mapPaymentStatusPlain,
    resolveEntityCardField,
    resolveStatusAccentColor,
} from '@/utils/entityCardUtils';
import PrintInvoiceDialog from "@/views/components/app/dialog/PrintInvoiceDialog.vue";
import printInvoiceMixin from "@/mixins/printInvoiceMixin";
import kanbanByStatusMixin from "@/mixins/kanbanByStatusMixin";
import OrderFilters from "@/views/components/orders/OrderFilters.vue";
import ViewModeToggle from "@/views/components/app/ViewModeToggle.vue";
import TableSkeleton from "@/views/components/app/TableSkeleton.vue";
import CardsSkeleton from "@/views/components/app/CardsSkeleton.vue";
import CardFieldsGearMenu from '@/views/components/app/CardFieldsGearMenu.vue';
import cardFieldsVisibilityMixin from '@/mixins/cardFieldsVisibilityMixin';
import { getClientDisplayName, getClientDisplayPosition } from '@/utils/displayUtils';
import { formatCashRegisterDisplay, buildCashRegisterRowInlineHtml } from '@/utils/cashRegisterUtils';
import timelineUnreadMixin from '@/mixins/timelineUnreadMixin';

import listQueryMixin from "@/mixins/listQueryMixin";
import filterPresetsMixin from "@/mixins/filterPresetsMixin";
import { FILTER_PRESET_SOURCE_ORDERS } from "@/constants/filterPresetSources";
import { createStoreViewModeMixin } from "@/mixins/storeViewModeMixin";

const ordersViewModeMixin = createStoreViewModeMixin({
    getter: "ordersViewMode",
    dispatch: "setOrdersViewMode",
    modes: ["table", "kanban", "cards"],
});

export default {
    components: { SideModalDialog, PrimaryButton, DraggableTable, TableControlsBar, KanbanBoard, CardListViewShell, MapperCardGrid, OrderCreatePage, InvoiceCreatePage, TransactionCreatePage, BatchButton, AlertDialog, TimelinePanel: TimelinePanelAsync, TableFilterButton, PrintInvoiceDialog, OrderFilters, ViewModeToggle, TableSkeleton, CardsSkeleton, CardFieldsGearMenu, draggable: VueDraggableNext },
    mixins: [getApiErrorMessage, crudEventMixin, notificationMixin, modalMixin, batchActionsMixin, companyChangeMixin, listQueryMixin, filterPresetsMixin, printInvoiceMixin, storeDataLoaderMixin, kanbanByStatusMixin, exportTableMixin, ordersViewModeMixin, cardFieldsVisibilityMixin, timelineSideModalMixin, timelineUnreadMixin],
    data() {
        return {
            filterPresetSource: FILTER_PRESET_SOURCE_ORDERS,
            cardFieldsKey: 'admin.orders.cards',
            titleField: 'clientTitle',
            statuses: [],
            projects: [],
            clients: [],
            categories: [],
            showBatchStatusSelect: false,
            editingItem: null,
            invoiceModalDialog: false,
            invoicePreselectedOrderIds: [],
            controller: OrderController,
            cacheInvalidationType: 'orders',
            itemViewRouteName: 'OrderView',
            baseRouteName: 'Orders',
            exportPermission: 'orders_export',
            errorGettingItemText: this.$t('errorGettingOrder'),
            savedSuccessText: this.$t('orderSaved'),
            savedErrorText: this.$t('errorSavingOrder'),
            deletedSuccessText: this.$t('orderDeleted'),
            deletedErrorText: this.$t('errorDeletingOrder'),
            columnsConfig: [
                { name: 'select', label: '#', size: 15 },
                { name: "id", label: "№", size: 20, html: true },
                { name: "statusName", label: 'status', component: markRaw(StatusSelectCell), props: (i) => ({ value: i.statusId, statuses: this.statuses, onChange: (newStatusId) => this.handleChangeStatus([i.id], newStatusId) }), },
                { name: "cashName", label: 'cashRegister', html: true },
                { name: "warehouseName", label: 'warehouse' },
                {
                    name: "dateUser",
                    label: 'dateUser',
                    component: markRaw(DateUserCell),
                    props: (item) => buildDateUserCellProps(item, this.searchQuery),
                },
                { name: "client", label: 'client', component: markRaw(ClientButtonCell), props: (i) => ({ client: i.client, searchQuery: this.searchQuery }), },
                { name: "projectName", label: 'project' },
                {
                    name: "products",
                    label: 'products',
                    component: markRaw(ProductsListCell),
                    props: (i) => ({
                        products: i.products || [],
                    }),
                },
                { name: "paymentStatusText", label: 'payment', size: 56, html: true },
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
            transactionModal: false,
            editingTransaction: null,
            viewTransactionModal: false,
            editingTransactionItem: null,
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
                showPagination: true,
                paginationData: this.paginationData,
                onPageChange: this.refetchList,
                onPerPageChange: this.handlePerPageChange,
            };
        },
        orderTransactionFormConfig() {
            return TRANSACTION_FORM_PRESETS.orderPayment;
        },
        transactionViewFormConfig() {
            return TRANSACTION_FORM_PRESETS.full;
        },
        viewTransactionSideTitle() {
            if (!this.viewTransactionModal) {
                return '';
            }
            return transactionSideModalTitle(this.$t.bind(this), { editingItem: this.editingTransactionItem });
        },
        cardConfigBase() {
            return [
                entityTitleMeta('categoryName', { label: 'productCategory' }),
                entityHeroFull('cardHeroText', { lineClamp: false, label: 'products' }),
                entityChip('projectName', ENTITY_CHIP_ICON.project, { label: 'project' }),
                entityMeta('description', 'description', { visible: false }),
                entityMeta('note', 'note', { visible: false }),
                entityFooterDate('date', { label: 'date' }),
                entityFooterStatus('statusName', { label: 'status' }),
                entityFooterAmount('totalPrice', { html: true, label: 'orderAmount' }),
                entityFooterPayment('paymentStatusPlain', { label: 'orderPaymentStatus' }),
            ];
        },
        orderEntityCard() {
            return createEntityCardOptions({
                accentColor: (item) => resolveStatusAccentColor(item, this.statuses),
                statusPill: createEntityStatusPillForItem({
                    statuses: this.statuses,
                    translateStatus: (name) => translateOrderStatus(name, this.$t),
                    onChange: (item, statusId) => this.handleChangeStatus([item.id], statusId),
                }),
                headerSuffix: (item) => this.timelineUnreadBadgeHtml(item?.id),
            });
        },
        orderKanbanEntityCard() {
            return {
                cardConfig: this.cardFields.filter((field) => field.name !== 'statusName'),
                cardMapper: this.orderCardMapper,
                entity: {
                    ...this.orderEntityCard,
                    statusPill: null,
                    showAccent: false,
                },
                titleField: 'clientTitle',
                titleSubtitleField: 'idCard',
                showCheckbox: this.$store.getters.hasPermission('orders_delete'),
            };
        },
    },
    created() {
        this.fetchStatuses();
        this.syncFilterReferenceData();

        this.$store.commit("SET_SETTINGS_OPEN", false);
        eventBus.on('global-search', this.handleSearch);
    },

    beforeUnmount() {
        eventBus.off('global-search', this.handleSearch);
    },
    methods: {
        translateOrderStatus,
        syncFilterReferenceData() {
            this.projects = this.$store.getters.activeProjects || [];
            this.clients = this.$store.getters.clients || [];
        },
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
                    totalPrice: 'def_total_price',
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
        orderCardMapper(item, field) {
            const search = this.searchQuery;
            return resolveEntityCardField(item, field, {
                idCard: () => mapEntityIdSubtitle(item.id),
                clientTitle: () => getClientDisplayName(item?.client) || this.$t('notSpecified'),
                categoryName: () => {
                    const name = item.category?.name || item.categoryName || '';
                    if (!name) {
                        return '';
                    }
                    return search ? highlightMatches(name, search) : name;
                },
                cardHeroText: () => mapEntityProductsLine(item, 1),
                projectName: () => mapEntityProjectChip(item.project?.name || item.projectName || ''),
                description: () => {
                    const text = item.description || '';
                    if (!text) {
                        return '';
                    }
                    return search ? highlightMatches(text, search) : text;
                },
                note: () => {
                    const text = item.note || '';
                    if (!text) {
                        return '';
                    }
                    return search ? highlightMatches(text, search) : text;
                },
                paymentStatusPlain: () => mapPaymentStatusPlain(item, this.$t.bind(this)),
                totalPrice: () => item.priceInfoHtml?.() ?? item.priceInfo(),
            }, (name) => this.itemMapper(item, name));
        },
        timelineUnreadBadgeHtml(entityId) {
            const count = this.getTimelineUnreadCount(entityId);
            if (count <= 0) {
                return '';
            }
            return `<span class="inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-[var(--color-danger)] px-1.5 text-[10px] font-semibold leading-none text-white">${count}</span>`;
        },
        itemMapper(i, c) {
            const search = this.searchQuery;

            switch (c) {
                case "id": {
                    const idValue = search
                        ? highlightMatches(String(i.id ?? ""), search)
                        : i.id;
                    return `${idValue}${this.timelineUnreadBadgeHtml(i.id)}`;
                }
                case "products":
                    return (i.products || []).length;
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
                    const statusName = i.status?.name || i.statusName;
                    return statusName ? translateOrderStatus(statusName, this.$t) : '';
                }
                case "paymentStatusText":
                    return buildPaymentStatusHtml(i, this.$t.bind(this), (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;'), { iconOnly: true });
                case "cashName":
                    return buildCashRegisterRowInlineHtml(
                        i,
                        formatCashRegisterDisplay(i.cashName, i.currencyCode),
                    );
                case "warehouseName":
                    return i.warehouse?.name || i.warehouseName || "";
                case "totalPrice":
                    return i.priceInfo();
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
        refetchList(page = 1, silent = false) {
            return this.fetchItems(page, silent);
        },
        async handleCompanyChanged() {
            this.selectedIds = [];
            this.resetKanbanPagination();
            await this.waitForFilterPresetsInitialization();
            if (!this._filterPresetsTriggeredListFetch) {
                await this.refetchList(1);
            }
        },
        async fetchItems(page = 1, silent = false) {
            if (this.displayViewMode === 'kanban') {
                if (page === 1) this.resetKanbanPagination();
                if (!silent) this.loading = true;
                try {
                    await this.fetchKanbanInitial();
                    const kanbanItems = this.allKanbanItems || [];
                    await this.fetchTimelineUnreadCounts('order', kanbanItems.map(item => item.id));
                    this.applyTimelineUnreadCounts(kanbanItems);
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
                    this.perPage
                );
                this.data = response;
                const items = response.items || [];
                await this.fetchTimelineUnreadCounts('order', items.map(item => item.id));
                this.applyTimelineUnreadCounts(items);
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
                this.kanbanFetchPerPage
            );
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
                    `${this.$t('remainingAmount')}: ${paymentData.remaining_amount} ${order.currencyCode}`,
                    true
                );

                this.editingTransaction = {
                    orderId: order.id,
                    client: order.client,
                    clientBalances: balancesForDocumentPayment(
                        order.client?.balances ?? [],
                        order.clientBalanceId ?? null,
                    ),
                    documentBalanceId: order.clientBalanceId ?? null,
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

        async toggleTimeline() {
            const willOpen = this.timelineCollapsed;
            timelineSideModalMixin.methods.toggleTimeline.call(this);
            if (!willOpen || !this.editingItem?.id) {
                return;
            }
            await this.markTimelineEntityAsRead('order', this.editingItem.id);
            this.applyTimelineUnreadCounts(this.data?.items || []);
            this.applyTimelineUnreadCounts(this.allKanbanItems || []);
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
        async resetFilters() {
            await this.resetFiltersToSystemDefaults(() => {
                this.refetchList(1);
            });
        },
        getActiveFiltersCount() {
            return this.getActiveFiltersCountFromConfig([
                { value: this.dateFilter, defaultValue: 'all_time' },
                { value: this.statusFilter, defaultValue: '' },
                { value: this.projectFilter, defaultValue: '' },
                { value: this.clientFilter, defaultValue: '' },
                { value: this.categoryFilter, defaultValue: '' },
                { value: this.dateFilter === 'custom' ? this.startDate : null, defaultValue: null },
                { value: this.dateFilter === 'custom' ? this.endDate : null, defaultValue: null }
            ]);
        },
        createInvoiceFromOrders() {
            if (!this.selectedIds?.length) {
                this.showNotification(this.$t('error'), this.$t('selectOrdersFirst'), true);
                return;
            }

            this.invoicePreselectedOrderIds = [...this.selectedIds];
            this.invoiceModalDialog = true;
        },

        createInvoiceFromOrder(orderId) {
            const id = Number(orderId);
            if (!id) {
                return;
            }
            this.invoicePreselectedOrderIds = [id];
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
            this.invoicePreselectedOrderIds = [];
        },

        closeInvoiceModal() {
            this.handleInvoiceModalClose();
        },

        handleInvoiceSaved() {
            this.showNotification(this.$t('success'), this.$t('invoiceCreated'), false);
            this.invoiceModalDialog = false;
            this.invoicePreselectedOrderIds = [];
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
                    const order = this.getCurrentItems().find(o => Number(o.id) === Number(updateData.orderId));
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
        '$store.state.clients'() {
            this.syncFilterReferenceData();
        },
        '$store.state.projects'() {
            this.projects = this.$store.getters.activeProjects;
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
    async mounted() {
        if (!this.$store.getters.projects?.length) {
            this.$store.dispatch('loadProjects');
        }
        if (!this.$store.getters.clients?.length) {
            this.$store.dispatch('loadClients');
        }
        this.syncFilterReferenceData();
        await this.waitForFilterPresetsInitialization();
        if (!this._filterPresetsTriggeredListFetch) {
            await this.fetchItems();
        }
    }
};
</script>
