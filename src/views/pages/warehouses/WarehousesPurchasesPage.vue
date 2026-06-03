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
        :cards-toolbar="purchasesCardsToolbar"
      >
        <template #table>
          <DraggableTable
            table-key="admin.warehouse_purchases"
            :columns-config="columnsConfig"
            :table-data="data.items"
            :item-mapper="itemMapper"
            highlight-draft-rows
            :on-item-click="openPurchaseFromRow"
          >
            <template #tableControlsBar="{ resetColumns, columns, toggleVisible, log }">
              <TableControlsBar
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
                    :onclick="openNewPurchase"
                    icon="fas fa-plus"
                    :disabled="!$store.getters.hasPermission('warehouse_purchases_create')"
                  />
                  <ViewModeToggle
                    :view-mode="displayViewMode"
                    :show-kanban="false"
                    :show-cards="true"
                    @change="changeViewMode"
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
            :onclick="openNewPurchase"
            icon="fas fa-plus"
            :disabled="!$store.getters.hasPermission('warehouse_purchases_create')"
          />
          <ViewModeToggle
            :view-mode="displayViewMode"
            :show-kanban="false"
            :show-cards="true"
            @change="changeViewMode"
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
            :card-mapper="purchaseCardMapper"
            title-field="title"
            title-subtitle-field="date"
            :title-prefix="purchaseCardTitlePrefix"
            :show-checkbox="false"
            @dblclick="openPurchaseFromRow"
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
      :title="sideModalTitle"
      :onclose="handleModalClose"
      :timeline-collapsed="timelineCollapsed"
      :show-timeline-button="!!editingItem"
      @toggle-timeline="toggleTimeline"
    >
      <WarehousesPurchaseCreatePage
        v-if="modalDialog"
        ref="warehousePurchaseCreatePageForm"
        :editing-item="editingItem"
        @saved="handleSaved"
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
          :type="'wh_purchase'"
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
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import CardsSkeleton from '@/views/components/app/CardsSkeleton.vue';
import ViewModeToggle from '@/views/components/app/ViewModeToggle.vue';
import MapperCardGrid from '@/views/components/app/cards/MapperCardGrid.vue';
import CardListViewShell from '@/views/components/app/cards/CardListViewShell.vue';
import CardFieldsGearMenu from '@/views/components/app/CardFieldsGearMenu.vue';
import WarehousesPurchaseCreatePage from '@/views/pages/warehouses/WarehousesPurchaseCreatePage.vue';
import WarehousePurchaseController from '@/api/WarehousePurchaseController';
import StatusSelectCell from '@/views/components/app/buttons/StatusSelectCell.vue';
import { createWarehouseDocumentStatusConfig, getWarehouseDocumentStatusCellProps, warehouseStatusLabel } from '@/utils/warehouseDocumentStatusSelect';
import notificationMixin from '@/mixins/notificationMixin';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import cardFieldsVisibilityMixin from '@/mixins/cardFieldsVisibilityMixin';
import listQueryMixin from '@/mixins/listQueryMixin';
import companyChangeMixin from '@/mixins/companyChangeMixin';
import modalMixin from '@/mixins/modalMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import { createStoreViewModeMixin } from '@/mixins/storeViewModeMixin';
import { formatCurrencyForDisplay } from '@/utils/numberUtils';
import { canWarehousePurchase } from '@/utils/warehousePurchasePermissions';
import { buildAmountWithPaymentStatusFooter, buildPaymentStatusHtml } from '@/utils/paymentStatusCell';
import { markRaw } from 'vue';
import { TimelinePanelAsync } from '@/utils/timelinePanelAsync';
import timelineSideModalMixin from '@/mixins/timelineSideModalMixin';
import timelineUnreadMixin from '@/mixins/timelineUnreadMixin';

const warehousePurchasesListViewModeMixin = createStoreViewModeMixin({
    listPageKey: 'warehousePurchases',
    modes: ['table', 'cards'],
});

export default {
    components: {
        PrimaryButton,
        SideModalDialog,
        DraggableTable,
        TableControlsBar,
        TableFilterButton,
        TableSkeleton,
        CardsSkeleton,
        ViewModeToggle,
        MapperCardGrid,
        CardListViewShell,
        CardFieldsGearMenu,
        WarehousesPurchaseCreatePage,
        TimelinePanel: TimelinePanelAsync,
        draggable: VueDraggableNext,
    },
    mixins: [modalMixin, notificationMixin, crudEventMixin, getApiErrorMessageMixin, cardFieldsVisibilityMixin, listQueryMixin, companyChangeMixin, warehousePurchasesListViewModeMixin, timelineSideModalMixin, timelineUnreadMixin],
    data() {
        return {
            controller: WarehousePurchaseController,
            cacheInvalidationType: 'purchases',
            savedSuccessText: this.$t('createdSuccess'),
            savedErrorText: this.$t('error'),
            deletedSuccessText: this.$t('deletedSuccess'),
            deletedErrorText: this.$t('error'),
            cardFieldsKey: 'admin.warehouse_purchases.cards',
            columnsConfig: [
                { name: 'id', label: 'number', size: 70 },
                {
                    name: 'status',
                    label: 'status',
                    component: markRaw(StatusSelectCell),
                    props: (item) => getWarehouseDocumentStatusCellProps(
                        item,
                        this.purchaseStatusConfig.statusesForSelect,
                        (newStatus) => this.handlePurchaseStatusChange(item, newStatus),
                        {
                            disabled: !canWarehousePurchase(this.$store.getters, 'update'),
                            filterStatuses: (_rowItem, statuses) => statuses.filter((s) => s.id !== 'completed'),
                        },
                    ),
                },
                { name: 'supplier', label: 'client' },
                { name: 'warehouse', label: 'warehouse' },
                { name: 'date', label: 'date' },
                { name: 'amount', label: 'totalAmount', size: 150, html: true },
                { name: 'paymentStatusText', label: 'payment', size: 72, html: true },
            ],
        };
    },
    computed: {
        isDataReady() {
            return this.data != null && !this.loading;
        },
        paginationData() {
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
        purchasesCardsToolbar() {
            return {
                showPagination: true,
                paginationData: this.paginationData,
                onPageChange: this.fetchItems,
                onPerPageChange: this.handlePerPageChange,
            };
        },
        cardConfigBase() {
            return [
                { name: 'title', label: null },
                { name: 'status', label: 'status', icon: 'fas fa-signal text-[#3571A4]' },
                { name: 'supplier', label: 'client', icon: 'fas fa-user text-[#3571A4]' },
                { name: 'warehouse', label: 'warehouse', icon: 'fas fa-warehouse text-[#3571A4]' },
                { name: 'date', label: 'date', icon: 'fas fa-calendar text-[#3571A4]' },
                { name: 'amountWithPaymentStatus', slot: 'footer', html: true },
            ];
        },
        cardConfigMerged() {
            const title = { name: 'title', label: null };
            const rest = (this.cardFields || []).map((f) => ({ ...f, visible: f.visible }));
            return [title, ...rest];
        },
        sideModalTitle() {
            return this.editingItem?.id ? `${this.$t('purchases')} #${this.editingItem.id}` : this.$t('purchases');
        },
        purchaseStatusConfig() {
            return createWarehouseDocumentStatusConfig([
                ['draft', 'purchaseStatusDraft'],
                ['approved', 'purchaseStatusApproved'],
                ['completed', 'purchaseStatusCompleted'],
            ], this.$t.bind(this));
        },
        defaultCurrencyCode() {
            const defaultCurrency = this.$store.getters.currencies?.find((c) => c.isDefault);
            return defaultCurrency?.code ?? '';
        },
    },
    created() {
        this.$store.commit('SET_SETTINGS_OPEN', false);
    },
    mounted() {
        this.fetchItems();
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
        purchaseCardTitlePrefix() {
            return '<i class="fas fa-cart-plus text-[#3571A4] mr-1.5 flex-shrink-0"></i>';
        },
        supplierName(item) {
            const supplier = item?.supplier;
            if (!supplier) {
                return '-';
            }
            return supplier.displayName() || '-';
        },
        warehouseName(item) {
            return item?.warehouseName || '-';
        },
        purchaseDocumentCurrencySymbol(item) {
            return item?.origCurrencyCode || this.defaultCurrencyCode || '';
        },
        dateWithCreator(item) {
            return typeof item?.formatDateUser === 'function' ? item.formatDateUser() : '-';
        },
        timelineUnreadBadgeHtml(entityId) {
            const count = this.getTimelineUnreadCount(entityId);
            if (count <= 0) {
                return '';
            }
            return `<span class="inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-semibold leading-none text-white">${count}</span>`;
        },
        itemMapper(item, column) {
            switch (column) {
                case 'id':
                    return `${item?.id ?? ''}${this.timelineUnreadBadgeHtml(item?.id)}`;
                case 'status':
                    return warehouseStatusLabel(this.purchaseStatusConfig.options, item?.status);
                case 'supplier':
                    return this.supplierName(item);
                case 'warehouse':
                    return this.warehouseName(item);
                case 'date':
                    return this.dateWithCreator(item);
                case 'amount':
                    return this.purchaseListAmountHtml(item);
                case 'paymentStatusText':
                    return buildPaymentStatusHtml(item, this.$t.bind(this), (v) => this.escapeHtmlCell(v));
                default:
                    return item?.[column];
            }
        },
        escapeHtmlCell(value) {
            return String(value ?? '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        },
        isPurchaseListDefaultCurrency(item) {
            const def = this.$store.getters.currencies?.find((c) => c.isDefault);
            const docId = item?.origCurrencyId ?? item?.currencyId;
            if (!def || docId == null || docId === '') {
                return true;
            }
            return Number(def.id) === Number(docId);
        },
        purchaseListAmountPlain(item) {
            const defSymbol = this.defaultCurrencyCode;
            const defAmount = item?.amount;
            if (this.isPurchaseListDefaultCurrency(item)) {
                return formatCurrencyForDisplay(defAmount ?? 0, defSymbol, true);
            }
            const origAmount = item?.origAmount ?? defAmount;
            const docSymbol = this.purchaseDocumentCurrencySymbol(item);
            const main = formatCurrencyForDisplay(origAmount ?? 0, docSymbol, true);
            const sub = this.$t('productSearchEquivDefaultCurrency', {
                amount: formatCurrencyForDisplay(defAmount ?? 0, defSymbol, true),
            });
            return `${main} ${sub}`;
        },
        purchaseListAmountHtml(item) {
            const defSymbol = this.defaultCurrencyCode;
            const defAmount = item?.amount;
            if (this.isPurchaseListDefaultCurrency(item)) {
                return this.escapeHtmlCell(formatCurrencyForDisplay(defAmount ?? 0, defSymbol, true));
            }
            const origAmount = item?.origAmount ?? defAmount;
            const docSymbol = this.purchaseDocumentCurrencySymbol(item);
            const main = this.escapeHtmlCell(formatCurrencyForDisplay(origAmount ?? 0, docSymbol, true));
            const sub = this.escapeHtmlCell(this.$t('productSearchEquivDefaultCurrency', {
                amount: formatCurrencyForDisplay(defAmount ?? 0, defSymbol, true),
            }));
            return `<span class="inline-flex flex-nowrap items-baseline justify-center gap-x-1 whitespace-nowrap leading-tight"><span class="font-medium">${main}</span><span class="text-[11px] text-gray-500 dark:text-[var(--text-secondary)]">${sub}</span></span>`;
        },
        purchaseCardMapper(item, fieldName) {
            if (!item) {
                return '';
            }
            if (fieldName === 'title') {
                return `#${item.id}${this.timelineUnreadBadgeHtml(item.id)}`;
            }
            if (fieldName === 'amount') {
                return this.purchaseListAmountPlain(item);
            }
            if (fieldName === 'amountWithPaymentStatus') {
                return buildAmountWithPaymentStatusFooter(
                    this.purchaseListAmountPlain(item),
                    this.itemMapper(item, 'paymentStatusText'),
                    (v) => this.escapeHtmlCell(v)
                );
            }
            return this.itemMapper(item, fieldName) ?? '';
        },
        handlePerPageChange(newPerPage) {
            this.perPage = newPerPage;
            this.fetchItems(1, false);
        },
        async fetchItems(page = 1, silent = false) {
            if (!silent) {
                this.loading = true;
            }
            try {
                this.data = await this.controller.getItems(page, this.perPage, {});
                const items = this.data?.items || [];
                await this.fetchTimelineUnreadCounts('wh_purchase', items.map((row) => row.id));
                this.applyTimelineUnreadCounts(items);
            } catch (error) {
                const text = this.apiErrorLinesAsString(error);
                this.showNotification(this.$t('error'), text || this.$t('error'), true);
            }
            if (!silent) {
                this.loading = false;
            }
        },
        async openPurchaseFromRow(item) {
            if (!item?.id) {
                return;
            }
            try {
                const full = await WarehousePurchaseController.getItem(item.id);
                this.showModal(full);
            } catch (error) {
                const text = this.apiErrorLinesAsString(error);
                this.showNotification(this.$t('error'), text || this.$t('error'), true);
            }
        },
        async handlePurchaseStatusChange(item, newStatus) {
            if (
                !item?.id
                || !newStatus
                || newStatus === 'completed'
                || item.status === newStatus
                || item.status !== 'draft'
            ) {
                return;
            }
            await this.applyPurchaseStatusChange(item, newStatus);
        },
        async applyPurchaseStatusChange(item, newStatus) {
            this.loading = true;
            try {
                const cashId = item.cashId;
                if (!cashId) {
                    throw new Error(this.$t('cashRegister') + ': ' + this.$t('notSpecified'));
                }
                await WarehousePurchaseController.updateItem(item.id, {
                    status: newStatus,
                    cashId,
                });
                await this.fetchItems(this.data?.currentPage || 1, true);
                if (this.editingItem?.id === item.id) {
                    const full = await WarehousePurchaseController.getItem(item.id);
                    this.editingItem = full;
                }
                this.showNotification(this.$t('statusUpdated'), '', false);
            } catch (error) {
                const text = this.apiErrorLinesAsString(error);
                this.showNotification(this.$t('errorChangingStatus'), text || this.$t('error'), true);
            }
            this.loading = false;
        },
        openNewPurchase() {
            this.showModal(null);
        },
        async toggleTimeline() {
            const willOpen = this.timelineCollapsed;
            timelineSideModalMixin.methods.toggleTimeline.call(this);
            if (!willOpen || !this.editingItem?.id) {
                return;
            }
            await this.markTimelineEntityAsRead('wh_purchase', this.editingItem.id);
            this.applyTimelineUnreadCounts(this.data?.items || []);
        },
        handleCompanyChanged(companyId, previousCompanyId) {
            this.fetchItems(1, previousCompanyId == null);
        },
    },
};
</script>
