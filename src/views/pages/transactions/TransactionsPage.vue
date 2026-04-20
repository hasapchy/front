<template>
  <div>
    <TransactionsBalanceWrapper
      ref="balanceWrapper"
      :cash-register-id="cashRegisterId || null"
      :start-date="startDate"
      :end-date="endDate"
      :date-filter="dateFilter"
      :transaction-type-filter="transactionTypeFilter"
      :source-filter="sourceFilter"
      @balance-click="handleBalanceClick"
    />
    <transition
      name="fade"
      mode="out-in"
    >
      <CardListViewShell
        v-if="isDataReady && (displayViewMode === 'table' || displayViewMode === 'cards')"
        :key="cardListShellKey"
        :display-view-mode="displayViewMode"
        :cards-toolbar="cardsToolbar"
        cards-root-class="transactions-cards-container"
      >
        <template #table>
        <DraggableTable
          ref="draggableTable"
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
                <div class="flex items-center gap-2 flex-wrap">
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
                </div>
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
          <div class="flex items-center gap-2 flex-wrap">
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
          </div>
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
            :card-mapper="transactionCardMapper"
            title-field="title"
            title-subtitle-field="dateUser"
            :title-prefix="transactionCardTitlePrefix"
            :selected-ids="selectedIds"
            :show-checkbox="$store.getters.hasPermission('transactions_delete')"
            :footer-color-class="transactionFooterColorClass"
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
        <CardsSkeleton v-else />
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
import { VueDraggableNext } from 'vue-draggable-next';
import TransactionController from '@/api/TransactionController';
import TransactionDto from '@/dto/transaction/TransactionDto';
import TransactionCategoryController from '@/api/TransactionCategoryController';
import TransactionCreatePage from '@/views/pages/transactions/TransactionCreatePage.vue';
import TransactionsBalanceWrapper from '@/views/pages/transactions/TransactionsBalanceWrapper.vue';
import ClientButtonCell from '@/views/components/app/buttons/ClientButtonCell.vue';
import SourceButtonCell from '@/views/components/app/buttons/SourceButtonCell.vue';
import TransactionTypeCell from '@/views/components/app/buttons/TransactionTypeCell.vue';
import TransactionAmountCell from '@/views/components/app/buttons/TransactionAmountCell.vue';
import { markRaw } from 'vue';
import notificationMixin from '@/mixins/notificationMixin';
import { TimelinePanelAsync } from '@/utils/timelinePanelAsync';
import timelineSideModalMixin from '@/mixins/timelineSideModalMixin';
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
import { dayjsDateTime } from '@/utils/dateUtils';
import { formatNumber } from '@/utils/numberUtils';
import { getClientDisplayName } from '@/utils/displayUtils';
import { formatCashRegisterDisplay } from '@/utils/cashRegisterUtils';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import exportTableMixin from '@/mixins/exportTableMixin';
import { COMPANY_BROADCAST } from '@/services/companyBroadcastHub';

import listQueryMixin from '@/mixins/listQueryMixin';
import { createStoreViewModeMixin } from '@/mixins/storeViewModeMixin';

const transactionsViewModeMixin = createStoreViewModeMixin({
    getter: 'transactionsViewMode',
    dispatch: 'setTransactionsViewMode',
    modes: ['table', 'cards'],
});

export default {
    components: { AlertDialog, PrimaryButton, SideModalDialog, DraggableTable, TransactionCreatePage, TransactionsBalanceWrapper, BatchButton, TransactionFilters, CardFieldsGearMenu, TableControlsBar, TableFilterButton, TableSkeleton, ViewModeToggle, MapperCardGrid, CardListViewShell, CardsSkeleton, TimelinePanel: TimelinePanelAsync, draggable: VueDraggableNext },
    mixins: [modalMixin, notificationMixin, crudEventMixin, batchActionsMixin, getApiErrorMessageMixin, companyChangeMixin, listQueryMixin, cardFieldsVisibilityMixin, exportTableMixin, transactionsViewModeMixin, timelineSideModalMixin],
    data() {
        return {
            // data, loading, perPage, perPageOptions - из crudEventMixin
            // selectedIds - из batchActionsMixin
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
                { name: 'dateUser', label: 'dateUser' },
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
                        searchQuery: this.searchQuery,
                        onUpdated: () => this.fetchItems(this.data?.currentPage ?? 1, false),
                        onDeleted: () => this.fetchItems(this.data?.currentPage ?? 1, false)
                    })
                },
                { name: 'cashName', label: 'cashRegister' },
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
                { name: 'exchangeRate', label: 'exchangeRate', visible: false },
                { name: 'origAmount', label: 'originalAmount', visible: false },
            ],
            sourceOptions: [
                { value: 'sale', label: this.$t('sale') },
                { value: 'order', label: this.$t('order') },
                { value: 'other', label: this.$t('other') },
            ],
            categoryFilter: [],
            allTransactionCategories: [],
            cardFieldsKey: 'admin.transactions.cards',
            titleField: 'title',
            transferReturnStateStorageKey: 'transactions_transfer_return_state',
        }
    },
    computed: {
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
        cardsToolbar() {
            return {
                showPagination: true,
                paginationData: this.paginationData,
                onPageChange: this.fetchItems,
                onPerPageChange: this.handlePerPageChange,
                exportPermission: this.exportPermission,
                onExport: this.handleExport,
                exportLoading: this.exportLoading,
            };
        },
        transactionCardFieldsForSettings() {
            return [
                ...this.transactionCardFields,
                {
                    name: 'note',
                    label: this.$t('note'),
                    icon: 'fas fa-sticky-note text-gray-400 text-xs',
                    type: 'string',
                    showLabel: false,
                },
            ];
        },
        transactionCardFields() {
            return [
                {
                    name: 'dateUser',
                    label: this.$t('dateUser'),
                    icon: 'fas fa-calendar text-blue-600 text-xs',
                    type: 'string',
                    showLabel: false,
                    formatter: (value, item) => item.formatDate ? `${item.formatDate()} / ${item.creator?.name }` : (value )
                },
                {
                    name: 'type',
                    label: this.$t('type'),
                    icon: 'fas fa-exchange-alt text-purple-600 text-xs',
                    type: 'string',
                    showLabel: false,
                    formatter: (value, item) => {
                        if (item.type == 1) return this.$t('income');
                        if (item.type == 2) return this.$t('outcome');
                        if (item.isTransfer == 1) return this.$t('transfer');
                        return '';
                    }
                },
                {
                    name: 'source',
                    label: this.$t('source'),
                    icon: 'fas fa-tag text-purple-600 text-xs',
                    type: 'string',
                    showLabel: false,
                    formatter: (value, item) => {
                        if (item.sourceType === 'sale') return this.$t('sale');
                        if (item.sourceType === 'order') return this.$t('order');
                        if (item.sourceType === 'other') return this.$t('other');
                        return '';
                    }
                },
                {
                    name: 'cashName',
                    label: this.$t('cashRegister'),
                    icon: 'fas fa-cash-register text-blue-600 text-xs',
                    type: 'string',
                    showLabel: false,
                    formatter: (value, item) => formatCashRegisterDisplay(item.cashDisplayName, item.cashCurrencySymbol)
                },
                {
                    name: 'client',
                    label: this.$t('customer'),
                    icon: 'fas fa-user text-blue-600 text-xs',
                    type: 'object',
                    showLabel: false,
                    medium: true,
                    formatter: (value, item) => {
                        if (!item.client) return '';
                        return getClientDisplayName(item.client) || this.$t('notSpecified');
                    }
                },
                {
                    name: 'projectName',
                    label: this.$t('project'),
                    icon: 'fas fa-folder text-purple-600 text-xs',
                    type: 'string',
                    showLabel: false,
                    formatter: (value) => value 
                },
                {
                    name: 'categoryName',
                    label: this.$t('category'),
                    icon: 'fas fa-list text-gray-500 text-xs',
                    type: 'string',
                    showLabel: false,
                    formatter: (value) => translateTransactionCategory(value, this.$t) 
                },
            ];
        },
        getTransactionFooterFields() {
            return (transaction) => {
                const isPositive = transaction.type == 1;
                const amount = parseFloat(transaction.cashAmount || 0) * (isPositive ? 1 : -1);
                const symbol = transaction.cashCurrencySymbol ;
                
                return [
                    {
                        name: 'cashAmount',
                        label: this.$t('total'),
                        icon: 'fas fa-money-bill-wave text-xs',
                        type: 'price',
                        formatter: () => {
                            const formatted = formatNumber(amount, 2, true);
                            return symbol ? `${formatted} ${symbol}` : formatted;
                        },
                        colorClass: () => {
                            return isPositive ? 'text-green-700' : 'text-red-700';
                        },
                        iconColor: () => {
                            return isPositive ? 'text-green-600' : 'text-red-600';
                        }
                    }
                ];
            };
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
        cardConfigBase() {
            return [
                { name: 'title', label: null },
                { name: 'client', label: 'customer', icon: 'fas fa-user text-[#3571A4]' },
                { name: 'cashName', label: 'cashRegister', icon: 'fas fa-cash-register text-[#3571A4]' },
                { name: 'categoryName', label: 'category', icon: 'fas fa-list text-[#3571A4]' },
                { name: 'projectName', label: 'project', icon: 'fas fa-folder text-[#3571A4]' },
                { name: 'note', label: 'note', icon: 'fas fa-sticky-note text-[#3571A4]' },
                {
                    name: 'cashAmount',
                    label: 'amount',
                    slot: 'footer'
                }
            ];
        },
        cardConfigMerged() {
            const title = { name: 'title', label: null };
            const rest = (this.cardFields || []).map(f => ({ ...f, visible: f.visible }));
            return [title, ...rest];
        }
    },
    watch: {
        // Отслеживаем изменения касс в store
        '$store.state.cashRegisters'(newVal) {
            this.allCashRegisters = newVal;
        },
        '$store.state.projects'(newVal) {
            this.allProjects = newVal;
        },
        '$route.params.id': {
            immediate: true,
            handler(value) {
                this.handleRouteItem(value);
            }
        },
    },
    created() {
        this.$store.commit('SET_SETTINGS_OPEN', false);

        eventBus.on('global-search', this.handleSearch);
        eventBus.on(COMPANY_BROADCAST.TRANSACTION_CREATED, this.onRemoteTransactionCreated);
    },

    mounted() {
        const restoredPage = this.restoreTransferReturnState();
        this.fetchItems(restoredPage || 1);
        this.allCashRegisters = this.$store.getters.cashRegisters;
        this.allProjects = this.$store.getters.activeProjects;
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
        updateBalace(silent = false) {
            if (this.$refs.balanceWrapper) {
                this.$refs.balanceWrapper.fetchItems(silent);
            }
        },
        onRemoteTransactionCreated({ creatorId }) {
            if (Number(this.$store.state.user?.id) === Number(creatorId)) {
                return;
            }
            this.fetchItems(this.data?.currentPage ?? 1, true).catch((e) => console.error(e));
            this.updateBalace(true);
        },
        itemMapper(i, c) {
            const search = this.searchQuery;

            switch (c) {
                case 'id':
                    if (search) {
                        return highlightMatches(String(i.id ?? ''), search);
                    }
                    return i.id;
                case 'cashName':
                    return formatCashRegisterDisplay(i.cashDisplayName, i.cashCurrencySymbol);
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
                    return `${i.exchangeRate} ${i.cashCurrencySymbol }`.trim();
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
                const categoryIds = this.categoryFilter.length > 0 ? this.categoryFilter.map(id => parseInt(id)) : null;
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
                // Если уже установлены такие же фильтры, сбрасываем их
                this.cashRegisterId = '';
                this.transactionTypeFilter = '';
            } else {
                // Устанавливаем фильтры по кассе и типу транзакции
                this.cashRegisterId = data.cashRegisterId;
                this.transactionTypeFilter = data.transactionType;
            }
            this.fetchItems(1);
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
        resetFilters() {
            this.resetFiltersFromConfig({
                cashRegisterId: '',
                transactionTypeFilter: '',
                sourceFilter: '',
                projectId: '',
                debtFilter: 'all',
                categoryFilter: [],
                dateFilter: 'this_month',
                startDate: null,
                endDate: null
            });
        },
        async handleCompanyChanged(companyId, previousCompanyId) {
            const isInitialLoad = previousCompanyId == null;
            this.cashRegisterId = '';
            this.transactionTypeFilter = '';
            this.sourceFilter = '';
            this.projectId = '';
            this.debtFilter = 'all';
            this.categoryFilter = [];
            this.dateFilter = 'this_month';
            this.startDate = null;
            this.endDate = null;
            this.selectedIds = [];
            await this.loadTransactionCategories();

            await this.fetchItems(1, isInitialLoad);
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
            try {
                const categories = await TransactionCategoryController.getListItems();
                this.allTransactionCategories = categories || [];
            } catch (error) {
                console.error('Failed to load transaction categories:', error);
                this.allTransactionCategories = [];
            }
        },
        handleCategoryFilterChange(value) {
            const selected = Array.isArray(value) ? value : [];
            this.categoryFilter = selected;
        },
        getTransactionTitle(transaction) {
            if (!transaction || !transaction.id) {
                return `${this.$t('number')}${this.$t('symbolEmDash')}`;
            }
            return `${this.$t('number')}${transaction.id}`;
        },
        transactionCardTitlePrefix(item) {
            if (!item) return '';
            if (item.isTransfer == 1) {
                return '<i class="fas fa-exchange-alt text-[#3571A4] mr-1.5 flex-shrink-0" title="' + this.$t('transfer') + '"></i>';
            }
            const isIncome = item.type == 1;
            const iconClass = isIncome ? 'fas fa-arrow-down text-green-600' : 'fas fa-arrow-up text-red-600';
            const title = isIncome ? this.$t('income') : this.$t('outcome');
            return `<i class="${iconClass} mr-1.5 flex-shrink-0" title="${title}"></i>`;
        },
        transactionFooterColorClass(item, fieldName) {
            if (fieldName === 'cashAmount' && item) {
                return item.type == 1 ? 'text-green-600' : 'text-red-600';
            }
            return null;
        },
        transactionCardMapper(item, fieldName) {
            if (!item) return '';
            switch (fieldName) {
                case 'title':
                    return this.getTransactionTitle(item);
                case 'dateUser':
                    return item.formatDate ? `${item.formatDate()} / ${item.creator?.name }` : '';
                case 'type':
                    if (item.type == 1) return this.$t('income');
                    if (item.type == 2) return this.$t('outcome');
                    if (item.isTransfer == 1) return this.$t('transfer');
                    return '';
                case 'source':
                    if (item.sourceType === 'sale') return this.$t('sale');
                    if (item.sourceType === 'order') return this.$t('order');
                    if (item.sourceType === 'other') return this.$t('other');
                    return '';
                case 'cashName':
                    return formatCashRegisterDisplay(item.cashDisplayName, item.cashCurrencySymbol);
                case 'client':
                    if (!item.client) return '';
                    return getClientDisplayName(item.client) ;
                case 'projectName':
                    return item.projectName ;
                case 'categoryName':
                    return translateTransactionCategory(item.categoryName, this.$t) ;
                case 'note':
                    return item.note ;
                case 'cashAmount': {
                    const isPositive = item.type == 1;
                    const amount = parseFloat(item.cashAmount || 0) * (isPositive ? 1 : -1);
                    const symbol = item.cashCurrencySymbol ;
                    const formatted = formatNumber(amount, 2, true);
                    return symbol ? `${formatted} ${symbol}` : formatted;
                }
                default:
                    return this.itemMapper(item, fieldName) ?? '';
            }
        },
        toggleSelectRow(id) {
            const index = this.selectedIds.indexOf(id);
            if (index > -1) {
                this.selectedIds.splice(index, 1);
            } else {
                this.selectedIds.push(id);
            }
        },
        formatDatabaseDateTime(value) {
            if (!value) return '';
            return dayjsDateTime(value);
        },
    },
}
</script>

<style scoped>
.cards-view-container {
    padding: 1rem 0;
}

.cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
    align-items: stretch; /* Растягиваем карточки на всю высоту для одинакового размера */
}

.cards-grid > * {
    height: 100%;
    display: flex;
    flex-direction: column;
}

@media (max-width: 640px) {
    .cards-grid {
        grid-template-columns: 1fr;
    }
}
</style>