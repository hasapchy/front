<template>
  <div>
    <TransactionsBalanceWrapper
      ref="balanceWrapper"
      :cash-register-id="cashRegisterId"
      :start-date="startDate"
      :end-date="endDate"
      :date-filter="dateFilter"
      :transaction-type-filter="transactionTypeFilter"
      :source-filter="sourceFilter"
      @balance-click="handleBalanceClick"
      @rows-count-change="balanceCardsRowsCount = $event"
    />
    <transition
      name="fade"
      mode="out-in"
    >
      <CardListViewShell
        v-if="isDataReady && (displayViewMode === 'table' || displayViewMode === 'cards')"
        :key="cardListShellKey"
        :display-view-mode="displayViewMode"
        :cards-toolbar="transactionsCardsToolbar"
        cards-root-class="transactions-cards-container"
      >
        <template #table>
          <DraggableTable
            table-key="admin.transactions"
            :columns-config="columnsConfig"
            :table-data="data.items"
            :item-mapper="itemMapper"
            :on-item-click="onItemClick"
            @selection-change="selectedIds = $event"
          >
            <template #tableControlsBar="{ resetColumns, columns, toggleVisible, log }">
              <TableControlsBar
                :show-pagination="true"
                :pagination-data="paginationData"
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
                    :onclick="openCreateIncomeModal"
                    icon="fas fa-plus"
                    :aria-label="$t('income')"
                    :disabled="!$store.getters.hasPermission('transactions_create')"
                  />
                  <PrimaryButton
                    :onclick="openCreateOutcomeModal"
                    icon="fas fa-minus"
                    :is-danger="true"
                    :aria-label="$t('outcome')"
                    :disabled="!$store.getters.hasPermission('transactions_create')"
                  />
                  <PrimaryButton
                    :onclick="openCreateTransferPage"
                    icon="fas fa-right-left"
                    :aria-label="$t('transfer')"
                    :disabled="!$store.getters.hasPermission('transfers_create')"
                  />
                  <transition name="fade">
                    <BatchButton
                      v-if="selectedIds.length"
                      :selected-ids="selectedIds"
                      :batch-actions="getBatchActions()"
                    />
                  </transition>
                  <ViewModeToggle
                    :view-mode="displayViewMode"
                    :show-kanban="false"
                    :show-cards="true"
                    @change="changeViewMode"
                  />
                </template>
                <template #filters-desktop>
                  <TransactionFilters
                    :cash-register-id="cashRegisterId"
                    :transaction-type-filter="transactionTypeFilter"
                    :source-filter="sourceFilter"
                    :project-id="projectId"
                    :debt-filter="debtFilter"
                    :date-filter="dateFilter"
                    :start-date="startDate"
                    :end-date="endDate"
                    :all-cash-registers="allCashRegisters"
                    :all-projects="allProjects"
                    :source-options="sourceOptions"
                    :has-active-filters="hasActiveFilters"
                    :active-filters-count="getActiveFiltersCount()"
                    @update:cash-register-id="cashRegisterId = $event"
                    @update:transaction-type-filter="transactionTypeFilter = $event"
                    @update:source-filter="sourceFilter = $event"
                    @update:project-id="projectId = $event"
                    @update:debt-filter="debtFilter = $event"
                    @update:date-filter="dateFilter = $event"
                    @update:start-date="startDate = $event"
                    @update:end-date="endDate = $event"
                    @reset="resetFilters"
                    @apply="applyFilters"
                  />
                </template>
                <template #gear="{ resetColumns, columns, toggleVisible, log }">
                  <TableFilterButton
                    v-if="columns && columns.length"
                    :on-reset="resetColumns"
                  >
                    <BalanceCardsRowsSection
                      v-if="showBalanceCardsRowsSetting"
                      :model-value="balanceCardsRowsCount"
                      @update:model-value="setBalanceCardsRowsCount"
                    />
                    <TableColumnDateModeSection
                      :items="dateColumnsForSettings(columns)"
                      :resolve-mode="resolveColumnDateMode"
                      @set-mode="(item, mode) => setColumnDateDisplayMode(columns, item.index, mode)"
                    />
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
                          <div class="space-x-2 flex flex-row justify-between w-full select-none items-center">
                            <div class="min-w-0">
                              <i
                                class="text-sm mr-2 text-[var(--color-info)]"
                                :class="[element.visible ? 'fas fa-circle-check' : 'far fa-circle']"
                              />
                              {{ $te(element.label) ? $t(element.label) : element.label }}
                            </div>
                            <div class="flex items-center gap-1">
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
            :onclick="openCreateIncomeModal"
            icon="fas fa-plus"
            :aria-label="$t('income')"
            :disabled="!$store.getters.hasPermission('transactions_create')"
          />
          <PrimaryButton
            :onclick="openCreateOutcomeModal"
            icon="fas fa-minus"
            :is-danger="true"
            :aria-label="$t('outcome')"
            :disabled="!$store.getters.hasPermission('transactions_create')"
          />
          <PrimaryButton
            :onclick="openCreateTransferPage"
            icon="fas fa-right-left"
            :aria-label="$t('transfer')"
            :disabled="!$store.getters.hasPermission('transfers_create')"
          />
          <transition name="fade">
            <BatchButton
              v-if="selectedIds.length"
              :selected-ids="selectedIds"
              :batch-actions="getBatchActions()"
            />
          </transition>
          <ViewModeToggle
            :view-mode="displayViewMode"
            :show-kanban="false"
            :show-cards="true"
            @change="changeViewMode"
          />
        </template>
        <template #card-bar-filters-desktop>
          <TransactionFilters
            :cash-register-id="cashRegisterId"
            :transaction-type-filter="transactionTypeFilter"
            :source-filter="sourceFilter"
            :project-id="projectId"
            :debt-filter="debtFilter"
            :date-filter="dateFilter"
            :start-date="startDate"
            :end-date="endDate"
            :all-cash-registers="allCashRegisters"
            :all-projects="allProjects"
            :source-options="sourceOptions"
            :has-active-filters="hasActiveFilters"
            :active-filters-count="getActiveFiltersCount()"
            @update:cash-register-id="cashRegisterId = $event"
            @update:transaction-type-filter="transactionTypeFilter = $event"
            @update:source-filter="sourceFilter = $event"
            @update:project-id="projectId = $event"
            @update:debt-filter="debtFilter = $event"
            @update:date-filter="dateFilter = $event"
            @update:start-date="startDate = $event"
            @update:end-date="endDate = $event"
            @reset="resetFilters"
            @apply="applyFilters"
          />
        </template>
        <template #card-bar-gear>
          <CardFieldsGearMenu
            :card-fields="cardFields"
            :on-reset="resetCardFields"
            :show-balance-cards-rows="showBalanceCardsRowsSetting"
            :balance-cards-rows="balanceCardsRowsCount"
            @toggle="toggleCardFieldVisible"
            @balance-cards-rows-change="setBalanceCardsRowsCount"
          />
        </template>
        <template #cards>
          <MapperCardGrid
            class="mt-4"
            :items="data.items"
            :card-config="cardConfigMerged"
            :card-mapper="transactionCardMapper"
            card-layout="entity"
            title-field="cardTitle"
            title-subtitle-field="idSubtitle"
            :entity="transactionEntityCard"
            :selected-ids="selectedIds"
            :show-checkbox="$store.getters.hasPermission('transactions_delete')"
            @dblclick="onItemClick"
            @select-toggle="toggleSelectRow"
          />
        </template>
      </CardListViewShell>
      <div
        v-else
        key="loader"
        class="min-h-64"
      >
        <TableSkeleton v-if="displayViewMode === 'table'" />
        <CardsSkeleton
          v-else
          layout="entity"
        />
      </div>
    </transition>

    <SideModalDialog
      :show-form="modalDialog"
      :title="sideModalCrudTitle('sideModalGenTransaction', 'sideModalNomTransaction')"
      :onclose="handleModalClose"
      :timeline-collapsed="timelineCollapsed"
      :show-timeline-button="!!editingItem"
      @toggle-timeline="toggleTimeline"
    >
      <TransactionCreatePage
        v-if="modalDialog"
        :key="editingItem ? editingItem.id : 'new-transaction'"
        ref="transactioncreatepageForm"
        :editing-item="editingItem"
        :default-cash-id="cashRegisterId || null"
        :form-config="activeFormConfig"
        @saved="handleSaved"
        @saved-error="handleSavedError"
        @deleted="handleDeleted"
        @deleted-error="handleDeletedError"
        @close-request="closeModal"
        @copy-transaction="handleCopyTransaction"
      />

      <template #timeline>
        <TimelinePanel
          v-if="editingItem && !timelineCollapsed"
          :id="editingItem.id"
          ref="timelinePanel"
          :type="'transaction'"
          @toggle-timeline="toggleTimeline"
        />
      </template>
    </SideModalDialog>
    <AlertDialog
      :dialog="deleteDialog"
      :descr="`${$t('confirmDelete')} (${selectedIds.length})?`"
      :confirm-text="$t('delete')"
      :leave-text="$t('cancel')"
      @confirm="confirmDeleteItems"
      @leave="deleteDialog = false"
    />
  </div>
</template>

<script>
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';
import TableColumnDateModeSection from '@/views/components/app/forms/TableColumnDateModeSection.vue';
import BalanceCardsRowsSection from '@/views/components/app/forms/BalanceCardsRowsSection.vue';
import { VueDraggableNext } from 'vue-draggable-next';
import TransactionController from '@/api/TransactionController';
import TransactionDto from '@/dto/transaction/TransactionDto';
import TransactionCreatePage from '@/views/pages/transactions/TransactionCreatePage.vue';
import TransactionsBalanceWrapper from '@/views/pages/transactions/TransactionsBalanceWrapper.vue';
import ClientButtonCell from '@/views/components/app/buttons/ClientButtonCell.vue';
import DateUserCell from '@/views/components/app/buttons/DateUserCell.vue';
import { buildDateUserCellProps } from '@/utils/userCellUtils';
import SourceButtonCell from '@/views/components/app/buttons/SourceButtonCell.vue';
import TransactionTypeCell from '@/views/components/app/buttons/TransactionTypeCell.vue';
import TransactionAmountCell from '@/views/components/app/buttons/TransactionAmountCell.vue';
import DebtCell from '@/views/components/app/buttons/DebtCell.vue';
import { markRaw } from 'vue';
import notificationMixin from '@/mixins/notificationMixin';
import { TimelinePanelAsync } from '@/utils/timelinePanelAsync';
import timelineSideModalMixin from '@/mixins/timelineSideModalMixin';
import timelineUnreadMixin from '@/mixins/timelineUnreadMixin';
import modalMixin from '@/mixins/modalMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import BatchButton from '@/views/components/app/buttons/BatchButton.vue';
import batchActionsMixin from '@/mixins/batchActionsMixin';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import companyChangeMixin from '@/mixins/companyChangeMixin';
import { eventBus } from '@/eventBus';
import { translateTransactionCategory } from '@/utils/transactionCategoryUtils';
import cardFieldsVisibilityMixin from '@/mixins/cardFieldsVisibilityMixin';
import { highlightMatches } from '@/utils/searchUtils';
import TRANSACTION_FORM_PRESETS from '@/constants/transactionFormPresets';
import ViewModeToggle from '@/views/components/app/ViewModeToggle.vue';
import MapperCardGrid from '@/views/components/app/cards/MapperCardGrid.vue';
import CardListViewShell from '@/views/components/app/cards/CardListViewShell.vue';
import CardsSkeleton from '@/views/components/app/CardsSkeleton.vue';
import TransactionFilters from '@/views/components/transactions/TransactionFilters.vue';
import CardFieldsGearMenu from '@/views/components/app/CardFieldsGearMenu.vue';
import { dayjsDateTime, normalizeDateDisplayMode } from '@/utils/dateUtils';
import { formatCurrencyForDisplay } from '@/utils/numberUtils';
import { getClientDisplayName } from '@/utils/displayUtils';
import {
    formatCashRegisterDisplay,
    buildCashRegisterEntityChipHtml,
    buildCashRegisterRowInlineHtml,
} from '@/utils/cashRegisterUtils';
import {
    createEntityCardOptions,
    ENTITY_CHIP_ICON,
    entityChip,
    entityFooterAmount,
    entityFooterCaption,
    entityFooterDate,
    entityFooterPayment,
    entityTitleMeta,
    mapEntityChip,
    mapEntityClientChip,
    mapEntityClientTitleHtml,
    mapEntityCreditPillHtml,
    mapEntityProjectCreditRow,
    mapEntityIdSubtitle,
    isTransactionDebt,
    resolveEntityCardField,
    resolveTransactionAccentColor,
    resolveTransactionAmountColor,
} from '@/utils/entityCardUtils';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import exportTableMixin from '@/mixins/exportTableMixin';
import { COMPANY_BROADCAST } from '@/services/companyBroadcastHub';
import {
    buildTransactionSourceChipHtml,
    getSourceDisplayText,
    getSourceKind,
    getSourceKindLabel,
} from '@/utils/transactionSourceUtils';

import listQueryMixin from '@/mixins/listQueryMixin';
import filterPresetsMixin from '@/mixins/filterPresetsMixin';
import { createStoreViewModeMixin } from '@/mixins/storeViewModeMixin';
import { FILTER_PRESET_SOURCE_TRANSACTIONS } from '@/constants/filterPresetSources';
const transactionsViewModeMixin = createStoreViewModeMixin({
    getter: 'transactionsViewMode',
    dispatch: 'setTransactionsViewMode',
    modes: ['table', 'cards'],
});

export default {
    components: { AlertDialog, PrimaryButton, SideModalDialog, DraggableTable, TableControlsBar, TransactionCreatePage, TransactionsBalanceWrapper, BatchButton, TransactionFilters, CardFieldsGearMenu, TableFilterButton, TableColumnDateModeSection, BalanceCardsRowsSection, TableSkeleton, ViewModeToggle, MapperCardGrid, CardListViewShell, CardsSkeleton, TimelinePanel: TimelinePanelAsync, draggable: VueDraggableNext },
    mixins: [modalMixin, notificationMixin, crudEventMixin, batchActionsMixin, getApiErrorMessageMixin, companyChangeMixin, listQueryMixin, filterPresetsMixin, cardFieldsVisibilityMixin, exportTableMixin, transactionsViewModeMixin, timelineSideModalMixin, timelineUnreadMixin],
    data() {
        return {
            filterPresetSource: FILTER_PRESET_SOURCE_TRANSACTIONS,
            controller: TransactionController,
            cacheInvalidationType: 'transactions',
            deletePermission: 'transactions_delete',
            itemViewRouteName: 'TransactionView',
            baseRouteName: 'Transactions',
            errorGettingItemText: this.$t('errorGettingTransaction'),
            showStatusSelect: false,
            allCashRegisters: [],
            cashRegisterId: '',
            dateFilter: 'this_month',
            startDate: null,
            endDate: null,
            transactionTypeFilter: '',
            sourceFilter: '',
            projectId: '',
            debtFilter: 'all',
            allProjects: [],
            savedSuccessText: this.$t('transactionSuccessfullyAdded'),
            savedErrorText: this.$t('errorSavingTransaction'),
            deletedSuccessText: this.$t('transactionSuccessfullyDeleted'),
            deletedErrorText: this.$t('errorDeletingTransaction'),
            currentFormConfig: TRANSACTION_FORM_PRESETS.full,
            columnsConfig: [
                { name: 'select', label: '#', size: 15 },
                { name: 'id', label: 'number', size: 60, html: true },
                {
                    name: 'dateUser',
                    label: 'dateUser',
                    type: 'datetime',
                    component: markRaw(DateUserCell),
                    props: (item, column) => buildDateUserCellProps(item, this.searchQuery, column?.dateDisplayMode),
                },
                {
                    name: 'type',
                    label: 'type',
                    component: markRaw(TransactionTypeCell),
                    props: (item) => ({
                        transaction: item
                    })
                },
                {
                    name: 'source',
                    label: 'source',
                    component: markRaw(SourceButtonCell),
                    props: (item) => ({
                        sourceType: item.sourceType,
                        sourceId: item.sourceId,
                        source: item.source,
                        searchQuery: this.searchQuery,
                        onUpdated: () => this.fetchItems(this.data?.currentPage ?? 1, false),
                        onDeleted: () => this.fetchItems(this.data?.currentPage ?? 1, false)
                    })
                },
                { name: 'cashName', label: 'cashRegister', html: true },
                {
                    name: 'client',
                    label: 'customer',
                    component: markRaw(ClientButtonCell),
                    props: (item) => ({
                        client: item.client,
                        searchQuery: this.searchQuery
                    })
                },
                { name: 'projectName', label: 'project' },
                { name: 'categoryName', label: 'category' },
                { name: 'note', label: 'note', html: true, size: 200 },
                {
                    name: 'cashAmount',
                    label: 'amount',
                    component: markRaw(TransactionAmountCell),
                    props: (item) => ({
                        transaction: item
                    })
                },
                {
                    name: 'isDebt',
                    label: 'debt',
                    visible: false,
                    component: markRaw(DebtCell),
                    props: (item) => ({
                        isDebt: item.isDebt,
                    }),
                },
                { name: 'exchangeRate', label: 'exchangeRate', visible: false },
                { name: 'origAmount', label: 'originalAmount', visible: false },
            ],
            sourceOptions: [
                { value: 'sale', label: this.$t('sale') },
                { value: 'order', label: this.$t('order') },
                { value: 'receipt', label: this.$t('receipt') },
                { value: 'writeoff', label: this.$t('writeoff') },
                { value: 'purchase', label: this.$t('purchase') },
                { value: 'contract', label: this.$t('contract') },
                { value: 'transaction', label: this.$t('transaction') },
                { value: 'salary', label: this.$t('salary') },
                { value: 'other', label: this.$t('other') },
            ],
            categoryFilter: [],
            allTransactionCategories: [],
            cardFieldsKey: 'admin.transactions.cards',
            titleField: 'cardTitle',
            transferReturnStateStorageKey: 'transactions_transfer_return_state',
            balanceCardsRowsCount: 1,
        }
    },
    computed: {
        showBalanceCardsRowsSetting() {
            return this.$store.getters.hasPermission('settings_cash_balance_view')
                || this.$store.getters.hasPermission('settings_client_balance_view');
        },
        exportPermission() {
            return 'transactions_export';
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
        transactionsCardsToolbar() {
            return {
                showFilters: true,
                hasActiveFilters: this.hasActiveFilters,
                activeFiltersCount: this.getActiveFiltersCount(),
                onFiltersReset: this.resetFilters,
                showPagination: true,
                paginationData: this.paginationData,
                onPageChange: this.fetchItems,
                onPerPageChange: this.handlePerPageChange,
                exportPermission: this.exportPermission,
                onExport: this.handleExport,
                exportLoading: this.exportLoading,
            };
        },
        transactionEntityCard() {
            return createEntityCardOptions({
                accentColor: (item) => resolveTransactionAccentColor(item),
                headerSuffix: (item) => this.timelineUnreadBadgeInlineHtml(item?.id),
            });
        },
        cardConfigBase() {
            return [
                entityTitleMeta('titleMeta', { reserveEmpty: true, label: 'category' }),
                entityChip('projectRow', ENTITY_CHIP_ICON.project, { reserveEmpty: true, heroSpan: 'full', label: 'project' }),
                entityFooterDate('date', { label: 'date', type: 'date' }),
                entityFooterCaption('sourceLabel', { captionClass: 'entity-card__footer-caption--chip', label: 'source' }),
                entityFooterAmount('cashAmount', { html: true, label: 'amount' }),
                entityFooterPayment('cashName', { html: true, label: 'cashRegister' }),
            ];
        },
        cardConfigMerged() {
            return (this.cardFields || []).map((f) => ({ ...f, visible: f.visible }));
        },
        searchQuery() {
            return this.$store.state.searchQuery;
        },
        fullFormConfig() {
            return TRANSACTION_FORM_PRESETS.full;
        },
        activeFormConfig() {
            return this.currentFormConfig || TRANSACTION_FORM_PRESETS.full;
        },
        transactionCategoryOptions() {
            return this.allTransactionCategories.map(category => ({
                value: category.id,
                label: translateTransactionCategory(category.name, this.$t) || category.name
            }));
        },
        hasActiveFilters() {
            return this.getActiveFiltersCount() > 0;
        },
    },
    watch: {
        // Отслеживаем изменения касс в store
        '$store.state.cashRegisters'(newVal) {
            this.allCashRegisters = newVal;
        },
        '$store.state.projects'() {
            this.allProjects = this.$store.getters.activeProjects;
        },
        '$route.params.id': {
            immediate: true,
            handler(value) {
                this.handleRouteItem(value);
            }
        },
        '$store.state.cashRegisterUserColorsRevision'() {
            this.$forceUpdate();
        },
    },
    created() {
        this.$store.commit('SET_SETTINGS_OPEN', false);

        eventBus.on('global-search', this.handleSearch);
        eventBus.on(COMPANY_BROADCAST.TRANSACTION_CREATED, this.onRemoteTransactionCreated);
    },

    async mounted() {
        const restoredPage = this.restoreTransferReturnState();
        if (!this.$store.getters.cashRegisters?.length) {
            this.$store.dispatch('loadCashRegisters');
        }
        if (!this.$store.getters.projects?.length) {
            this.$store.dispatch('loadProjects');
        }
        this.allCashRegisters = this.$store.getters.cashRegisters;
        this.allProjects = this.$store.getters.activeProjects;
        await this.loadTransactionCategories();
        await this.waitForFilterPresetsInitialization();
        if (!this._filterPresetsTriggeredListFetch) {
            await this.fetchItems(restoredPage || 1);
            this.updateBalace();
        }
    },
    beforeUnmount() {
        eventBus.off('global-search', this.handleSearch);
        eventBus.off(COMPANY_BROADCAST.TRANSACTION_CREATED, this.onRemoteTransactionCreated);
    },
    methods: {
        translateTransactionCategory,
        openCreateIncomeModal() {
            this.showModal(null, TRANSACTION_FORM_PRESETS.fullIncome);
        },
        openCreateOutcomeModal() {
            this.showModal(null, TRANSACTION_FORM_PRESETS.fullOutcome);
        },
        openCreateTransferPage() {
            this.saveTransferReturnState();
            this.$router.push({
                name: 'Transfers',
                query: {
                    create: '1',
                    from: 'transactions',
                },
            });
        },
        saveTransferReturnState() {
            const state = {
                cashRegisterId: this.cashRegisterId,
                dateFilter: this.dateFilter,
                startDate: this.startDate,
                endDate: this.endDate,
                transactionTypeFilter: this.transactionTypeFilter,
                sourceFilter: this.sourceFilter,
                projectId: this.projectId,
                debtFilter: this.debtFilter,
                categoryFilter: this.categoryFilter,
                page: this.data?.currentPage || 1,
                scrollY: window.pageYOffset ?? document.documentElement.scrollTop ?? 0,
            };
            sessionStorage.setItem(this.transferReturnStateStorageKey, JSON.stringify(state));
        },
        restoreTransferReturnState() {
            if (this.$route.query.fromTransfer !== '1') {
                return null;
            }
            const rawState = sessionStorage.getItem(this.transferReturnStateStorageKey);
            sessionStorage.removeItem(this.transferReturnStateStorageKey);
            if (!rawState) {
                return null;
            }
            const state = JSON.parse(rawState);
            this.cashRegisterId = state.cashRegisterId ?? '';
            this.dateFilter = state.dateFilter ?? 'this_month';
            this.startDate = state.startDate ?? null;
            this.endDate = state.endDate ?? null;
            this.transactionTypeFilter = state.transactionTypeFilter ?? '';
            this.sourceFilter = state.sourceFilter ?? '';
            this.projectId = state.projectId ?? '';
            this.debtFilter = state.debtFilter ?? 'all';
            this.categoryFilter = Array.isArray(state.categoryFilter) ? state.categoryFilter : [];

            this.$nextTick(() => {
                requestAnimationFrame(() => {
                    window.scrollTo({
                        top: Number(state.scrollY) || 0,
                        behavior: 'instant',
                    });
                });
            });

            if (this.$route.query.fromTransfer === '1') {
                this.$router.replace({ name: 'Transactions' });
            }
            return Number(state.page) || 1;
        },
        async refetchList(page = 1) {
            await this.fetchItems(page, true);
            this.updateBalace(true);
        },
        applyFilters() {
            this.fetchItems(1, true);
            this.updateBalace(true);
        },
        updateBalace(silent = false) {
            if (this.$refs.balanceWrapper) {
                this.$refs.balanceWrapper.fetchItems(silent);
            }
        },
        setBalanceCardsRowsCount(count) {
            this.balanceCardsRowsCount = count === 2 ? 2 : 1;
            this.$refs.balanceWrapper?.setRowsCount(this.balanceCardsRowsCount);
        },
        async onRemoteTransactionCreated({ creatorId }) {
            if (Number(this.$store.state.user?.id) === Number(creatorId)) {
                return;
            }
            const fetchPromise = this.fetchItems(this.data?.currentPage ?? 1, true);
            this.updateBalace(true);
            try {
                await fetchPromise;
            } catch {
            }
        },
        itemMapper(i, c) {
            const search = this.searchQuery;

            switch (c) {
                case 'id': {
                    const idValue = search
                        ? highlightMatches(String(i.id ?? ''), search)
                        : i.id;
                    const badge = this.timelineUnreadBadgeFloatingHtml(i.id);
                    return `<span class="relative inline-flex items-center pr-2">${idValue}${badge}</span>`;
                }
                case 'cashName':
                    return buildCashRegisterRowInlineHtml(
                        i,
                        formatCashRegisterDisplay(i.cashDisplayName, i.cashCurrencyCode)
                    );
                case 'cashAmount': {
                    const isPositive = i.type == 1;
                    return parseFloat(i.cashAmount || 0) * (isPositive ? 1 : -1);
                }
                case 'origAmount':
                    return parseFloat(i.origAmount || 0);
                case 'exchangeRate':
                    if (!i.exchangeRate || i.origCurrencyId === i.cashCurrencyId) {
                        return null;
                    }
                    return `${i.exchangeRate} ${i.cashCurrencyCode}`.trim();
                case 'note':
                    if (!i.note) return '';
                    return search ? highlightMatches(i.note, search) : i.note;
                case 'dateUser':
                    return `${i.formatDate()} / ${i.creator?.name }`;
                case 'categoryName':
                    return translateTransactionCategory(i.categoryName, this.$t) ;
                default:
                    return i[c];
            }
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

                const debtFilter = this.debtFilter === 'all' ? null : this.debtFilter;
                const categoryIds = this.categoryFilter.length > 0 ? this.categoryFilter.map(id => parseInt(id, 10)) : null;
                this.data = await TransactionController.getItems(
                    page,
                    this.cashRegisterId,
                    this.dateFilter,
                    null, // order_id
                    this.searchQuery,
                    this.transactionTypeFilter,
                    this.sourceFilter,
                    this.projectId,
                    this.perPage,
                    this.startDate,
                    this.endDate,
                    debtFilter,
                    categoryIds
                );
                const items = this.data?.items || [];
                await this.fetchTimelineUnreadCounts('transaction', items.map(item => item.id));
                this.applyTimelineUnreadCounts(items);
            } catch (error) {
                this.showNotification(this.$t('errorGettingTransactionList'), error.message, true);
            }
            if (!silent) {
                this.loading = false;
            }
        },
        showModal(item = null, formConfig = null) {
            this.resetTimelineSidebar();
            this.editingItem = null;
            this.currentFormConfig = formConfig || TRANSACTION_FORM_PRESETS.full;
            this.modalDialog = true;
            this.editingItem = item ? markRaw(TransactionDto.fromObject(item)) : null;
        },
        closeModal(skipScrollRestore = false) {
            modalMixin.methods.closeModal.call(this, skipScrollRestore);
            this.resetTimelineSidebar();
            if (this.$route.params.id) {
                this.$router.replace({ name: 'Transactions' });
            }
        },
        beforeShowModal() {
            this.currentFormConfig = TRANSACTION_FORM_PRESETS.full;
        },
        handleBalanceClick(data) {
            // Проверяем, установлены ли уже такие же фильтры
            const isSameFilters =
                this.cashRegisterId === data.cashRegisterId &&
                this.transactionTypeFilter === data.transactionType;

            if (isSameFilters) {
                this.cashRegisterId = '';
                this.transactionTypeFilter = '';
            } else {
                this.cashRegisterId = data.cashRegisterId;
                this.transactionTypeFilter = data.transactionType;
            }
            this.fetchItems(1);
            this.updateBalace();
        },
        getExportParams() {
            const debtFilter = this.debtFilter === 'all' ? undefined : this.debtFilter;
            const categoryIds = this.categoryFilter?.length ? this.categoryFilter : undefined;
            return {
                cashId: this.cashRegisterId || undefined,
                dateFilterType: this.dateFilter,
                search: this.searchQuery || undefined,
                transactionType: this.transactionTypeFilter || undefined,
                source: this.sourceFilter || undefined,
                projectId: this.projectId || undefined,
                startDate: this.startDate || undefined,
                endDate: this.endDate || undefined,
                isDebt: debtFilter,
                categoryIds: categoryIds,
            };
        },
        async resetFilters() {
            await this.resetFiltersToSystemDefaults();
            this.updateBalace(true);
        },
        async handleCompanyChanged(companyId, previousCompanyId) {
            const isInitialLoad = previousCompanyId == null;
            this.selectedIds = [];
            await this.loadTransactionCategories();
            await this.waitForFilterPresetsInitialization();
            this.updateBalace(isInitialLoad);
        },
        async onAfterSaved() {
            this.refreshTimelineIfVisible();
            this.updateBalace();
            await this.$store.dispatch('invalidateCache', { type: 'clients' });
            await this.$store.dispatch('loadClients');
        },
        async onAfterDeleted() {
            this.updateBalace();
            await this.$store.dispatch('invalidateCache', { type: 'clients' });
            await this.$store.dispatch('loadClients');
        },
        handleCopyTransaction(copiedTransaction) {
            // Закрываем текущее модальное окно
            this.closeModal();

            // Небольшая задержка для плавного перехода
            setTimeout(() => {
                // Открываем новое модальное окно с копированными данными
                this.showModal(copiedTransaction);
            }, 100);
        },
        async afterBatchDelete() {
            this.updateBalace();
            await this.$store.dispatch('invalidateCache', { type: 'clients' });
            await this.$store.dispatch('loadClients');
        },
        // Переопределяем метод пакетных действий для фильтрации трансферов
        getBatchActions() {
            // Фильтруем выбранные элементы, исключая трансферы
            const nonTransferIds = this.selectedIds.filter(id => {
                const item = this.data?.items?.find(i => i.id === id);
                return item && item.isTransfer != 1;
            });

            return [
                {
                    label: this.$t('delete'),
                    icon: "fas fa-trash",
                    type: "danger",
                    action: nonTransferIds.length > 0 ? () => {
                        const hasTransfers = this.selectedIds.length > nonTransferIds.length;
                        if (hasTransfers) {
                            this.showNotification(
                                this.$t('cannotDeleteTransfers'),
                                this.$t('transferTransactionsCannotBeDeleted'),
                                true
                            );
                        }
                        if (nonTransferIds.length > 0) {
                            this.deleteItems(nonTransferIds);
                        }
                    } : null,
                    disabled: this.loadingBatch || nonTransferIds.length === 0,
                },
            ];
        },
        getActiveFiltersCount() {
            const filters = [
                { value: this.cashRegisterId, defaultValue: '' },
                { value: this.transactionTypeFilter, defaultValue: '' },
                { value: this.sourceFilter, defaultValue: '' },
                { value: this.projectId, defaultValue: '' },
                { value: this.debtFilter, defaultValue: 'all' },
                { value: this.categoryFilter, defaultValue: [], isArray: true },
                { value: this.startDate, defaultValue: null },
                { value: this.endDate, defaultValue: null }
            ];
            let count = this.getActiveFiltersCountFromConfig(filters);
            if (this.dateFilter !== 'this_month' && this.dateFilter !== 'all_time') {
                count++;
            }
            return count;
        },
        async loadTransactionCategories() {
            if (!this.$store.getters.transactionCategories?.length) {
                await this.$store.dispatch('loadTransactionCategories');
            }
            this.allTransactionCategories = this.$store.getters.transactionCategories || [];
        },
        handleCategoryFilterChange(value) {
            const selected = Array.isArray(value) ? value : [];
            this.categoryFilter = selected;
        },
        resolveTransactionCardTitle(item) {
            const clientName = getClientDisplayName(item?.client);
            if (clientName) {
                return clientName;
            }
            return translateTransactionCategory(item?.categoryName, this.$t) || this.$t('notSpecified');
        },
        resolveTransactionTitleMeta(item) {
            const clientName = getClientDisplayName(item?.client);
            if (!clientName) {
                return '';
            }
            return translateTransactionCategory(item?.categoryName, this.$t) || '';
        },
        resolveTransactionSourceLabel(item) {
            if (!item?.sourceType) {
                return '';
            }
            if (item.sourceId) {
                return getSourceDisplayText(this.$t.bind(this), item.sourceType, item.sourceId, item.source || '');
            }
            return getSourceKindLabel(this.$t.bind(this), getSourceKind(item.sourceType, item.source || ''));
        },
        formatTransactionCardAmountHtml(item) {
            if (!item) {
                return '';
            }
            const isPositive = item.type == 1;
            const amount = parseFloat(item.cashAmount || 0) * (isPositive ? 1 : -1);
            const formatted = formatCurrencyForDisplay(amount, item.cashCurrencyCode, true);
            const color = resolveTransactionAmountColor(item);
            return `<span style="color:${color}">${formatted}</span>`;
        },
        timelineUnreadBadgeInlineHtml(entityId) {
            const count = this.getTimelineUnreadCount(entityId);
            if (count <= 0) {
                return '';
            }
            return `<span class="inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-[var(--color-danger)] px-1.5 text-[10px] font-semibold leading-none text-white">${count}</span>`;
        },
        timelineUnreadBadgeFloatingHtml(entityId) {
            const count = this.getTimelineUnreadCount(entityId);
            if (count <= 0) {
                return '';
            }
            return `<span class="absolute -right-2 -top-1 inline-flex min-w-[16px] h-[16px] items-center justify-center rounded-full bg-[var(--color-danger)] px-1 text-[9px] font-semibold leading-none text-white">${count}</span>`;
        },
        async toggleTimeline() {
            const willOpen = this.timelineCollapsed;
            timelineSideModalMixin.methods.toggleTimeline.call(this);
            if (!willOpen || !this.editingItem?.id) {
                return;
            }
            await this.markTimelineEntityAsRead('transaction', this.editingItem.id);
            this.applyTimelineUnreadCounts(this.data?.items || []);
        },
        transactionCardMapper(item, fieldName) {
            if (!item) {
                return '';
            }
            const search = this.searchQuery?.trim();
            const searchActive = search && search.length >= 3;
            const clientName = getClientDisplayName(item?.client);
            const cardTitle = this.resolveTransactionCardTitle(item);
            const titleMeta = this.resolveTransactionTitleMeta(item);
            const cashLabel = formatCashRegisterDisplay(item.cashDisplayName);
            const projectName = item.projectName ?? '';
            const sourceLabel = this.resolveTransactionSourceLabel(item);
            return resolveEntityCardField(item, fieldName, {
                cardTitle: () => {
                    if (clientName) {
                        const displayName = searchActive
                            ? highlightMatches(clientName, search)
                            : clientName;
                        return mapEntityClientTitleHtml(item?.client, displayName);
                    }
                    return searchActive && cardTitle
                        ? highlightMatches(cardTitle, search)
                        : cardTitle;
                },
                idSubtitle: () => mapEntityIdSubtitle(item.id),
                titleMeta: () => (
                    searchActive && titleMeta
                        ? highlightMatches(titleMeta, search)
                        : titleMeta
                ),
                cashName: () => buildCashRegisterEntityChipHtml(item, cashLabel),
                projectRow: () => mapEntityProjectCreditRow(
                    mapEntityChip(ENTITY_CHIP_ICON.project, projectName),
                    isTransactionDebt(item)
                        ? mapEntityCreditPillHtml(this.$t('credit'))
                        : '',
                ),
                sourceLabel: () => {
                    if (!item?.sourceType) {
                        return '';
                    }
                    const labelHtml = searchActive && sourceLabel
                        ? highlightMatches(sourceLabel, search)
                        : '';
                    return buildTransactionSourceChipHtml(
                        this.$t.bind(this),
                        item.sourceType,
                        item.sourceId,
                        item.source || '',
                        labelHtml,
                    );
                },
                cashAmount: () => this.formatTransactionCardAmountHtml(item),
            }, (name) => this.itemMapper(item, name) ?? '');
        },
        toggleSelectRow(id) {
            const index = this.selectedIds.indexOf(id);
            if (index > -1) {
                this.selectedIds.splice(index, 1);
            } else {
                this.selectedIds.push(id);
            }
        },
        isDateColumn(column) {
            return column?.type === 'date' || column?.type === 'datetime';
        },
        resolveColumnDateMode(column) {
            return normalizeDateDisplayMode(column?.type, column?.dateDisplayMode);
        },
        setColumnDateDisplayMode(columns, index, mode) {
            const column = columns?.[index];
            if (!this.isDateColumn(column)) {
                return;
            }
            column.dateDisplayMode = normalizeDateDisplayMode(column.type, mode);
            this.$forceUpdate();
            this.$nextTick(() => {
                localStorage.setItem(
                    this.$storageUi.tableColumnsStorageKey('admin.transactions', this.$store.state.currentCompany?.id),
                    JSON.stringify(columns.map((col) => {
                        const copy = { ...col };
                        delete copy.component;
                        delete copy.props;
                        return copy;
                    }))
                );
            });
        },
        dateColumnsForSettings(columns) {
            if (!Array.isArray(columns)) {
                return [];
            }
            return columns
                .map((column, index) => ({ column, index }))
                .filter(({ column }) => column.name !== 'select' && this.isDateColumn(column));
        },
        formatDatabaseDateTime(value) {
            if (!value) return '';
            return dayjsDateTime(value);
        },
    },
}
</script>
