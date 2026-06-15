<template>
  <div>
    <transition
      name="fade"
      mode="out-in"
    >
      <CardListViewShell
        v-if="isDataReady && (displayViewMode === 'table' || displayViewMode === 'cards')"
        :key="cardListShellKey"
        :display-view-mode="displayViewMode"
        :cards-toolbar="receiptCardsToolbar"
      >
        <template #table>
          <DraggableTable
            table-key="admin.warehouse_receipts"
            :columns-config="columnsConfig"
            :table-data="data.items"
            :item-mapper="itemMapper"
            highlight-draft-rows
            :on-item-click="openReceiptFromRow"
          >
            <template #tableControlsBar="{ resetColumns, columns, toggleVisible, log }">
              <TableControlsBar
                :show-pagination="true"
                :pagination-data="receiptPaginationData"
                :on-page-change="fetchItems"
                :on-per-page-change="handlePerPageChange"
                :reset-columns="resetColumns"
                :columns="columns"
                :toggle-visible="toggleVisible"
                :log="log"
              >
                <template #left>
                  <PrimaryButton
                    :onclick="openNewReceipt"
                    icon="fas fa-plus"
                    :disabled="!$store.getters.hasPermission('warehouse_receipts_create')"
                  />
                  <ViewModeToggle
                    :view-mode="displayViewMode"
                    :show-kanban="false"
                    :show-cards="true"
                    @change="changeViewMode"
                  />
                </template>
                <template #filters-desktop>
                  <WarehouseReceiptFilters
                    :date-filter="dateFilter"
                    :start-date="startDate"
                    :end-date="endDate"
                    :status-filter="statusFilter"
                    :warehouse-id-filter="warehouseIdFilter"
                    :product-id-filter="productIdFilter"
                    :has-active-filters="hasActiveFilters"
                    :active-filters-count="getActiveFiltersCount()"
                    @update:date-filter="dateFilter = $event"
                    @update:start-date="startDate = $event"
                    @update:end-date="endDate = $event"
                    @update:status-filter="statusFilter = $event"
                    @update:warehouse-id-filter="warehouseIdFilter = $event"
                    @update:product-id-filter="productIdFilter = $event"
                    @reset="resetFilters"
                    @apply="applyFilters"
                  />
                </template>

                <template #gear="{ resetColumns, columns, toggleVisible, log }">
                  <TableFilterButton
                    v-if="columns && columns.length"
                    :on-reset="resetColumns"
                  >
                    <ul>
                      <draggable
                        v-if="columns.length"
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
                                class="text-sm mr-2 text-[var(--color-info)]"
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
            :onclick="openNewReceipt"
            icon="fas fa-plus"
            :disabled="!$store.getters.hasPermission('warehouse_receipts_create')"
          />
          <ViewModeToggle
            :view-mode="displayViewMode"
            :show-kanban="false"
            :show-cards="true"
            @change="changeViewMode"
          />
        </template>
        <template #card-bar-filters-desktop>
          <WarehouseReceiptFilters
            :date-filter="dateFilter"
            :start-date="startDate"
            :end-date="endDate"
            :status-filter="statusFilter"
            :warehouse-id-filter="warehouseIdFilter"
            :product-id-filter="productIdFilter"
            :has-active-filters="hasActiveFilters"
            :active-filters-count="getActiveFiltersCount()"
            @update:date-filter="dateFilter = $event"
            @update:start-date="startDate = $event"
            @update:end-date="endDate = $event"
            @update:status-filter="statusFilter = $event"
            @update:warehouse-id-filter="warehouseIdFilter = $event"
            @update:product-id-filter="productIdFilter = $event"
            @reset="resetFilters"
            @apply="applyFilters"
          />
        </template>
        <template #card-bar-gear>
          <CardFieldsGearMenu
            :card-fields="cardFields"
            :on-reset="resetCardFields"
            @toggle="toggleCardFieldVisible"
          />
        </template>
        <template #cards>
          <MapperCardGrid
            class="mt-4"
            :items="data.items"
            :card-config="cardConfigMerged"
            :card-mapper="receiptCardMapper"
            title-field="title"
            title-subtitle-field="dateUser"
            :title-prefix="receiptCardTitlePrefix"
            :show-checkbox="false"
            @dblclick="openReceiptFromRow"
          />
        </template>
      </CardListViewShell>
      <div
        v-else
        key="loader"
        class="min-h-64"
      >
        <TableSkeleton v-if="displayViewMode === 'table'" />
        <CardsSkeleton v-else />
      </div>
    </transition>
    <SideModalDialog
      :show-form="modalDialog"
      :title="receiptModalTitle"
      :onclose="handleModalClose"
      :timeline-collapsed="timelineCollapsed"
      :show-timeline-button="!!editingItem"
      @toggle-timeline="toggleTimeline"
    >
      <WarehousesReceiptCreatePage
        v-if="modalDialog"
        ref="warehousesreceiptcreatepageForm"
        :editing-item="editingItem"
        :create-mode="receiptCreateMode"
        @update:create-mode="receiptCreateMode = $event"
        @saved="handleSaved"
        @saved-error="handleSavedError"
        @deleted="handleDeleted"
        @deleted-error="handleDeletedError"
        @close-request="closeModal"
        @receipt-refreshed="handleReceiptRefreshed"
      />
      <template #timeline>
        <TimelinePanel
          v-if="editingItem && !timelineCollapsed"
          :id="editingItem.id"
          ref="timelinePanel"
          :type="'wh_receipt'"
          @toggle-timeline="toggleTimeline"
        />
      </template>
    </SideModalDialog>
  </div>
</template>

<script>
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';
import { VueDraggableNext } from 'vue-draggable-next';
import WarehouseReceiptController from '@/api/WarehouseReceiptController';
import WarehousesReceiptCreatePage from '@/views/pages/warehouses/WarehousesReceiptCreatePage.vue';
import ClientButtonCell from '@/views/components/app/buttons/ClientButtonCell.vue';
import DateUserCell from '@/views/components/app/buttons/DateUserCell.vue';
import { buildDateUserCellProps } from '@/utils/userCellUtils';
import { buildCashRegisterRowInlineHtml } from '@/utils/cashRegisterUtils';
import ProductsListCell from '@/views/components/app/buttons/ProductsListCell.vue';
import ReceiptPurchaseSourceCell from '@/views/components/app/buttons/ReceiptPurchaseSourceCell.vue';
import StatusSelectCell from '@/views/components/app/buttons/StatusSelectCell.vue';
import { getSourceDisplayText } from '@/utils/transactionSourceUtils';
import { createWarehouseDocumentStatusConfig, getWarehouseDocumentStatusCellProps, warehouseStatusLabel } from '@/utils/warehouseDocumentStatusSelect';
import { markRaw } from 'vue';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';

import companyChangeMixin from '@/mixins/companyChangeMixin';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import CardsSkeleton from '@/views/components/app/CardsSkeleton.vue';
import ViewModeToggle from '@/views/components/app/ViewModeToggle.vue';
import MapperCardGrid from '@/views/components/app/cards/MapperCardGrid.vue';
import CardListViewShell from '@/views/components/app/cards/CardListViewShell.vue';
import CardFieldsGearMenu from '@/views/components/app/CardFieldsGearMenu.vue';
import WarehouseReceiptFilters from '@/views/components/app/WarehouseReceiptFilters.vue';
import cardFieldsVisibilityMixin from '@/mixins/cardFieldsVisibilityMixin';
import listQueryMixin from '@/mixins/listQueryMixin';
import { createStoreViewModeMixin } from '@/mixins/storeViewModeMixin';
import { formatCurrencyForDisplay } from '@/utils/numberUtils';
import { buildAmountWithPaymentStatusFooter, buildPaymentStatusHtml } from '@/utils/paymentStatusCell';
import { TimelinePanelAsync } from '@/utils/timelinePanelAsync';
import timelineSideModalMixin from '@/mixins/timelineSideModalMixin';
import timelineUnreadMixin from '@/mixins/timelineUnreadMixin';
import { eventBus } from '@/eventBus';
import { highlightMatches } from '@/utils/searchUtils';

const warehouseReceiptsListViewModeMixin = createStoreViewModeMixin({
    listPageKey: 'warehouseReceipts',
    modes: ['table', 'cards'],
});

export default {
    components: {
        PrimaryButton,
        SideModalDialog,
        DraggableTable,
        WarehousesReceiptCreatePage,
        TableControlsBar,
        TableFilterButton,
        TableSkeleton,
        CardsSkeleton,
        ViewModeToggle,
        MapperCardGrid,
        CardListViewShell,
        CardFieldsGearMenu,
        WarehouseReceiptFilters,
        TimelinePanel: TimelinePanelAsync,
        draggable: VueDraggableNext
    },
    mixins: [modalMixin, notificationMixin, crudEventMixin, getApiErrorMessageMixin, companyChangeMixin, cardFieldsVisibilityMixin, listQueryMixin, warehouseReceiptsListViewModeMixin, timelineSideModalMixin, timelineUnreadMixin],
    data() {
        return {
            dateFilter: 'all_time',
            startDate: null,
            endDate: null,
            statusFilter: '',
            warehouseIdFilter: '',
            productIdFilter: '',
            receiptCreateMode: 'default',
            cardFieldsKey: 'admin.warehouse_receipts.cards',
            controller: WarehouseReceiptController,
            cacheInvalidationType: 'receipts',
            editingItem: null,
            savedSuccessText: this.$t('receiptSuccessfullyAdded'),
            savedErrorText: this.$t('errorSavingReceipt'),
            deletedSuccessText: this.$t('receiptSuccessfullyDeleted'),
            deletedErrorText: this.$t('errorDeletingReceipt'),
            columnsConfig: [
                { name: 'id', label: 'number', size: 60, html: true },
                {
                    name: 'purchaseLink',
                    label: 'purchase',
                    size: 150,
                    component: markRaw(ReceiptPurchaseSourceCell),
                    props: (item) => ({
                        purchaseId: item.purchaseId,
                        onUpdated: () => this.fetchItems(this.data?.currentPage || 1, true),
                    }),
                },
                {
                    name: 'status',
                    label: 'status',
                    component: markRaw(StatusSelectCell),
                    props: (item) => getWarehouseDocumentStatusCellProps(
                        item,
                        this.receiptStatusConfig.statusesForSelect,
                        (newStatus) => this.handleReceiptStatusChange(item, newStatus),
                        {
                            disabled: !this.$store.getters.hasPermission('warehouse_receipts_update'),
                            lockedValues: ['approved', 'completed'],
                            filterStatuses: (_rowItem, statuses) => statuses.filter((s) => s.id !== 'completed'),
                        },
                    ),
                },
                {
                    name: 'dateUser',
                    label: 'dateUser',
                    component: markRaw(DateUserCell),
                    props: (item) => buildDateUserCellProps(item, this.searchQuery),
                },
                { name: 'client', label: 'client', component: markRaw(ClientButtonCell), props: (item) => ({ client: item.client, }) },
                { name: 'warehouseName', label: 'warehouse' },
                { name: 'cashName', label: 'cashRegister', html: true },
                {
                    name: 'products',
                    label: 'products',
                    component: markRaw(ProductsListCell),
                    props: (item) => ({
                        products: item.products || [],
                        searchQuery: this.searchQuery,
                    })
                },
                { name: 'amount', label: 'totalAmount', size: 150, html: true },
                { name: 'paymentStatusText', label: 'payment', size: 72, html: true },
                { name: 'note', label: 'note', html: true },
            ]
        }
    },
    watch: {
        editingItem(val) {
            if (val?.id) {
                this.receiptCreateMode = 'default';
            }
        },
    },
    computed: {
        isDataReady() {
            return this.data != null && !this.loading;
        },
        receiptPaginationData() {
            if (!this.data) {
                return null;
            }
            return {
                currentPage: this.data.currentPage,
                lastPage: this.data.lastPage,
                perPage: this.perPage,
                perPageOptions: this.perPageOptions,
            };
        },
        receiptCardsToolbar() {
            return {
                showFilters: true,
                hasActiveFilters: this.hasActiveFilters,
                activeFiltersCount: this.getActiveFiltersCount(),
                onFiltersReset: this.resetFilters,
                showPagination: true,
                paginationData: this.receiptPaginationData,
                onPageChange: this.fetchItems,
                onPerPageChange: this.handlePerPageChange,
            };
        },
        receiptModalTitle() {
            if (this.modalDialog && !this.editingItem && this.receiptCreateMode === 'simple') {
                return this.$t('receiptSimpleCreateTitle');
            }
            return this.sideModalCrudTitle('sideModalGenReceipt', 'sideModalNomReceipt');
        },
        cardConfigBase() {
            return [
                { name: 'title', label: null },
                { name: 'purchaseLink', label: 'purchase', icon: 'fas fa-cart-plus text-[#3571A4]' },
                { name: 'status', label: 'status', icon: 'fas fa-signal text-[#3571A4]' },
                { name: 'dateUser', label: 'dateUser', icon: 'fas fa-calendar text-[#3571A4]' },
                { name: 'client', label: 'client', icon: 'fas fa-user text-[#3571A4]' },
                { name: 'warehouseName', label: 'warehouse', icon: 'fas fa-warehouse text-[#3571A4]' },
                { name: 'cashName', label: 'cashRegister', icon: 'fas fa-cash-register text-[#3571A4]' },
                { name: 'products', label: 'products', icon: 'fas fa-box text-[#3571A4]' },
                { name: 'amountWithPaymentStatus', slot: 'footer', html: true },
                { name: 'note', label: 'note', icon: 'fas fa-sticky-note text-[#3571A4]' },
            ];
        },
        cardConfigMerged() {
            const title = { name: 'title', label: null };
            const rest = (this.cardFields || []).map((f) => ({ ...f, visible: f.visible }));
            return [title, ...rest];
        },
        receiptStatusConfig() {
            return createWarehouseDocumentStatusConfig([
                ['draft', 'receiptStatusDraft'],
                ['approved', 'purchaseStatusApproved'],
                ['completed', 'receiptStatusCompleted'],
            ], this.$t.bind(this));
        },
        defaultCurrencyCode() {
            const list = this.$store.getters.currencies || [];
            const defaultCurrency = list.find((currency) => currency?.isDefault);
            return defaultCurrency?.code || '';
        },
        searchQuery() {
            return this.$store.state.searchQuery;
        },
    },
    created() {
        this.$store.commit('SET_SETTINGS_OPEN', false);
        eventBus.on('global-search', this.handleSearch);
    },

    mounted() {
        this.fetchItems();
    },
    beforeUnmount() {
        eventBus.off('global-search', this.handleSearch);
    },
    methods: {
        showModal(item = null) {
            this.resetTimelineSidebar();
            modalMixin.methods.showModal.call(this, item);
        },
        closeModal(skipScrollRestore = false) {
            modalMixin.methods.closeModal.call(this, skipScrollRestore);
            this.resetTimelineSidebar();
        },
        timelineUnreadBadgeHtml(entityId) {
            const count = this.getTimelineUnreadCount(entityId);
            if (count <= 0) {
                return '';
            }
            return `<span class="inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-[var(--color-danger)] px-1.5 text-[10px] font-semibold leading-none text-white">${count}</span>`;
        },
        receiptCardTitlePrefix() {
            return '<i class="fas fa-file-invoice text-[#3571A4] mr-1.5 flex-shrink-0"></i>';
        },
        receiptClientPlain(i) {
            const c = i?.client;
            if (!c) {
                return '—';
            }
            return c.displayName || c.name || `#${c.id}`;
        },
        receiptDocumentCurrencySymbol(item) {
            return item?.origCurrencyCode || this.defaultCurrencyCode || '';
        },
        escapeHtmlCell(value) {
            return String(value ?? '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        },
        isReceiptListDefaultCurrency(item) {
            const def = this.$store.getters.currencies?.find((c) => c.isDefault);
            const docId = item?.origCurrencyId;
            if (!def || docId == null || docId === '') {
                return true;
            }
            return Number(def.id) === Number(docId);
        },
        receiptListAmountPlain(item) {
            const defSymbol = this.defaultCurrencyCode;
            const defAmount = item?.amount;
            if (this.isReceiptListDefaultCurrency(item)) {
                return formatCurrencyForDisplay(defAmount ?? 0, defSymbol, true);
            }
            const origAmount = item?.origAmount ?? defAmount;
            const docSymbol = this.receiptDocumentCurrencySymbol(item);
            const main = formatCurrencyForDisplay(origAmount ?? 0, docSymbol, true);
            const sub = this.$t('productSearchEquivDefaultCurrency', {
                amount: formatCurrencyForDisplay(defAmount ?? 0, defSymbol, true),
            });
            return `${main} ${sub}`;
        },
        receiptListAmountHtml(item) {
            const defSymbol = this.defaultCurrencyCode;
            const defAmount = item?.amount;
            if (this.isReceiptListDefaultCurrency(item)) {
                return this.escapeHtmlCell(formatCurrencyForDisplay(defAmount ?? 0, defSymbol, true));
            }
            const origAmount = item?.origAmount ?? defAmount;
            const docSymbol = this.receiptDocumentCurrencySymbol(item);
            const main = this.escapeHtmlCell(formatCurrencyForDisplay(origAmount ?? 0, docSymbol, true));
            const sub = this.escapeHtmlCell(this.$t('productSearchEquivDefaultCurrency', {
                amount: formatCurrencyForDisplay(defAmount ?? 0, defSymbol, true),
            }));
            return `<span class="inline-flex flex-nowrap items-baseline justify-center gap-x-1 whitespace-nowrap leading-tight"><span class="font-medium">${main}</span><span class="text-[11px] text-gray-500 dark:text-[var(--text-secondary)]">${sub}</span></span>`;
        },
        receiptCardMapper(item, fieldName) {
            if (!item) {
                return '';
            }
            if (fieldName === 'title') {
                return this.receiptClientPlain(item);
            }
            if (fieldName === 'client') {
                return this.receiptClientPlain(item);
            }
            if (fieldName === 'amount') {
                return this.receiptListAmountPlain(item);
            }
            if (fieldName === 'amountWithPaymentStatus') {
                return buildAmountWithPaymentStatusFooter(
                    this.receiptListAmountPlain(item),
                    this.itemMapper(item, 'paymentStatusText'),
                    (v) => this.escapeHtmlCell(v)
                );
            }
            return this.itemMapper(item, fieldName) ?? '';
        },
        itemMapper(i, c) {
            const search = this.searchQuery;

            switch (c) {
                case 'id': {
                    const badge = this.timelineUnreadBadgeHtml(i?.id);
                    const idValue = String(i?.id ?? '');
                    return `${search ? highlightMatches(idValue, search) : idValue}${badge}`;
                }
                case 'purchaseLink':
                    if (!i.purchaseId) {
                        return '—';
                    }
                    return getSourceDisplayText(this.$t.bind(this), 'WhPurchase', i.purchaseId);
                case 'status':
                    return warehouseStatusLabel(this.receiptStatusConfig.options, i.status);
                case 'cashName': {
                    const cashLabel = i.cashNameDisplay();
                    if (!i.cashId) {
                        return cashLabel;
                    }
                    return buildCashRegisterRowInlineHtml(i, cashLabel);
                }
                case 'note':
                    return search ? highlightMatches(i?.note ?? '', search) : (i?.note ?? '');
                case 'products':
                    return (i.products || []).length;
                case 'dateUser':
                    return typeof i?.formatDateUser === 'function' ? i.formatDateUser() : '-';
                case 'amount':
                    return this.receiptListAmountHtml(i);
                case 'paymentStatusText':
                    return buildPaymentStatusHtml(i, this.$t.bind(this), (v) => this.escapeHtmlCell(v));
                default:
                    return i[c];
            }
        },
        async openReceiptFromRow(item) {
            if (!item?.id) {
                return;
            }
            try {
                const full = await WarehouseReceiptController.getItem(item.id);
                this.showModal(full);
            } catch (error) {
                const text = this.apiErrorLinesAsString(error);
                this.showNotification(this.$t('errorGettingItem'), text || this.$t('error'), true);
            }
        },
        async handleReceiptStatusChange(item, newStatus) {
            if (
                !item?.id
                || !newStatus
                || (newStatus === 'completed' && item.status === 'draft')
                || (newStatus === 'draft' && item.status === 'approved')
                || item.status === 'approved'
                || item.status === 'completed'
                || item.status === newStatus
            ) {
                return;
            }
            if (item.status === 'draft' && newStatus === 'approved') {
                await this.applyReceiptStatusChange(item, newStatus);
            }
        },
        async applyReceiptStatusChange(item, newStatus) {
            this.loading = true;
            try {
                await WarehouseReceiptController.updateItem(item.id, { status: newStatus });
                await this.fetchItems(this.data?.currentPage || 1, true);
                if (this.editingItem?.id === item.id) {
                    const full = await WarehouseReceiptController.getItem(item.id);
                    this.editingItem = full;
                }
                this.showNotification(this.$t('statusUpdated'), '', false);
            } catch (error) {
                const text = this.apiErrorLinesAsString(error);
                this.showNotification(this.$t('errorChangingStatus'), text || this.$t('error'), true);
            }
            this.loading = false;
        },
        handleReceiptRefreshed(dto) {
            if (dto?.id && Number(dto.id) === Number(this.editingItem?.id)) {
                this.editingItem = dto;
            }
        },
        receiptListFilterParams() {
            const w = this.warehouseIdFilter;
            const pr = this.productIdFilter;
            const p = {
                ...(this.statusFilter ? { status: this.statusFilter } : {}),
                ...(w ? { warehouse_id: Number(w) } : {}),
                ...(pr ? { product_id: Number(pr) } : {}),
            };
            if (this.dateFilter && this.dateFilter !== 'all_time') {
                p.date_filter_type = this.dateFilter;
                if (this.dateFilter === 'custom') {
                    if (this.startDate) {
                        p.start_date = this.startDate;
                    }
                    if (this.endDate) {
                        p.end_date = this.endDate;
                    }
                }
            }
            return { ...p, ...(this.searchQuery ? { search: this.searchQuery } : {}) };
        },
        async fetchItems(page = 1, silent = false) {
            if (!silent) {
                this.loading = true;
            }
            try {
                this.data = await WarehouseReceiptController.getItems(page, this.perPage, this.receiptListFilterParams());
                const items = this.data?.items || [];
                await this.fetchTimelineUnreadCounts('wh_receipt', items.map((row) => row.id));
                this.applyTimelineUnreadCounts(items);
            } catch (error) {
                const text = this.apiErrorLinesAsString(error);
                this.showNotification(this.$t('errorLoadingReceipts'), text || this.$t('error'), true);
            }
            if (!silent) {
                this.loading = false;
            }
        },
        resetFilters() {
            this.dateFilter = 'all_time';
            this.startDate = null;
            this.endDate = null;
            this.statusFilter = '';
            this.warehouseIdFilter = '';
            this.productIdFilter = '';
            this.fetchItems(1, true);
        },
        getActiveFiltersCount() {
            return this.getActiveFiltersCountFromConfig([
                { value: this.dateFilter, defaultValue: 'all_time' },
                { value: this.dateFilter === 'custom' ? this.startDate : null, defaultValue: null },
                { value: this.dateFilter === 'custom' ? this.endDate : null, defaultValue: null },
                { value: this.statusFilter, defaultValue: '' },
                { value: this.warehouseIdFilter, defaultValue: '' },
                { value: this.productIdFilter, defaultValue: '' },
            ]);
        },
        openNewReceipt() {
            this.receiptCreateMode = 'default';
            this.showModal(null);
        },
        async handleSaved() {
            this.showNotification(
                this.savedSuccessText || 'Saved successfully',
                '',
                false
            );
            this.invalidateCache('onUpdate');
            await this.fetchItems(this.data?.currentPage || 1, true);
            this.shouldRestoreScrollOnClose = false;
            this.editingItem = null;
            this.closeModal(true);
            if (this.onAfterSaved) {
                await this.onAfterSaved();
            }
        },
        handleCompanyChanged(companyId, previousCompanyId) {
            this.dateFilter = 'all_time';
            this.startDate = null;
            this.endDate = null;
            this.statusFilter = '';
            this.warehouseIdFilter = '';
            this.productIdFilter = '';
            this.fetchItems(1, previousCompanyId == null);
        },
        async onAfterSaved() {
            this.refreshTimelineIfVisible();
            await this.$store.dispatch('invalidateCache', { type: 'clients' });
            await this.$store.dispatch('loadClients');
        },
        async toggleTimeline() {
            const willOpen = this.timelineCollapsed;
            timelineSideModalMixin.methods.toggleTimeline.call(this);
            if (!willOpen || !this.editingItem?.id) {
                return;
            }
            await this.markTimelineEntityAsRead('wh_receipt', this.editingItem.id);
            this.applyTimelineUnreadCounts(this.data?.items || []);
        },
        async onAfterDeleted() {
            await this.$store.dispatch('invalidateCache', { type: 'clients' });
            await this.$store.dispatch('loadClients');
        },
    }
}
</script>