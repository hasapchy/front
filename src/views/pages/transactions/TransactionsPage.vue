<template>
    <div>
        <TransactionsBalanceWrapper ref="balanceWrapper" :cash-register-id="cashRegisterId || null" :start-date="startDate"
            :end-date="endDate" :date-filter="dateFilter" :transaction-type-filter="transactionTypeFilter"
            :source-filter="sourceFilter" @balance-click="handleBalanceClick" />
        <transition name="fade" mode="out-in">
        <div v-if="isDataReady && viewMode === 'table'" key="table">
            <DraggableTable ref="draggableTable" table-key="admin.transactions" :columns-config="columnsConfig"
                :table-data="data.items" :item-mapper="itemMapper" @selectionChange="selectedIds = $event"
                :onItemClick="onItemClick">
                <template #tableControlsBar="{ resetColumns, columns, toggleVisible, log }">
                    <TableControlsBar
                        :show-pagination="true"
                        :pagination-data="paginationData"
                        :on-page-change="fetchItems" :on-per-page-change="handlePerPageChange"
                        :export-permission="exportPermission" :on-export="handleExport" :export-loading="exportLoading"
                        :resetColumns="resetColumns" :columns="columns" :toggleVisible="toggleVisible" :log="log">
                        <template #left>
                            <div class="flex items-center gap-2 flex-wrap">
                                <PrimaryButton :onclick="openCreateIncomeModal"
                                    icon="fas fa-plus"
                                    :disabled="!$store.getters.hasPermission('transactions_create')">
                                    {{ $t('income') || 'Приход' }}
                                </PrimaryButton>
                                <PrimaryButton :onclick="openCreateOutcomeModal"
                                    icon="fas fa-minus"
                                    :isDanger="true"
                                    :disabled="!$store.getters.hasPermission('transactions_create')">
                                    {{ $t('outcome') || 'Расход' }}
                                </PrimaryButton>
                                <transition name="fade">
                                    <BatchButton v-if="selectedIds.length" :selected-ids="selectedIds" :batch-actions="getBatchActions()" />
                                </transition>
                                <ViewModeToggle :view-mode="viewMode" :show-kanban="false" :show-cards="true" @change="changeViewMode" />
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
                                    @update:cashRegisterId="cashRegisterId = $event"
                                    @update:transactionTypeFilter="transactionTypeFilter = $event"
                                    @update:sourceFilter="sourceFilter = $event"
                                    @update:projectId="projectId = $event"
                                    @update:debtFilter="debtFilter = $event"
                                    @update:dateFilter="dateFilter = $event"
                                    @update:startDate="startDate = $event"
                                    @update:endDate="endDate = $event"
                                    @reset="resetFilters"
                                    @apply="applyFilters" />
                            </div>
                        </template>
                        <template #right>
                            <Pagination v-if="paginationData" :currentPage="paginationData.currentPage" :lastPage="paginationData.lastPage"
                                :per-page="paginationData.perPage" :per-page-options="paginationData.perPageOptions" :show-per-page-selector="true"
                                @changePage="fetchItems" @perPageChange="handlePerPageChange" />
                        </template>
                        <template #gear="{ resetColumns, columns, toggleVisible, log }">
                            <TableFilterButton v-if="columns && columns.length" :onReset="resetColumns">
                                <ul>
                                    <draggable v-if="columns.length" class="dragArea list-group w-full" :list="columns"
                                        @change="log">
                                        <li v-for="(element, index) in columns" :key="element.name" v-show="element.name !== 'select'"
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
        <div v-else-if="isDataReady && viewMode === 'cards'" key="cards" class="transactions-cards-container">
            <TableControlsBar
                :show-pagination="true"
                :pagination-data="paginationData"
                :on-page-change="fetchItems" :on-per-page-change="handlePerPageChange"
                :export-permission="exportPermission" :on-export="handleExport" :export-loading="exportLoading">
                <template #left>
                    <div class="flex items-center gap-2 flex-wrap">
                        <PrimaryButton :onclick="openCreateIncomeModal"
                            icon="fas fa-plus"
                            :disabled="!$store.getters.hasPermission('transactions_create')">
                            {{ $t('income') || 'Приход' }}
                        </PrimaryButton>
                        <PrimaryButton :onclick="openCreateOutcomeModal"
                            icon="fas fa-minus"
                            :isDanger="true"
                            :disabled="!$store.getters.hasPermission('transactions_create')">
                            {{ $t('outcome') || 'Расход' }}
                        </PrimaryButton>
                        <transition name="fade">
                            <BatchButton v-if="selectedIds.length" :selected-ids="selectedIds" :batch-actions="getBatchActions()" />
                        </transition>
                        <ViewModeToggle :view-mode="viewMode" :show-kanban="false" :show-cards="true" @change="changeViewMode" />
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
                            @update:cashRegisterId="cashRegisterId = $event"
                            @update:transactionTypeFilter="transactionTypeFilter = $event"
                            @update:sourceFilter="sourceFilter = $event"
                            @update:projectId="projectId = $event"
                            @update:debtFilter="debtFilter = $event"
                            @update:dateFilter="dateFilter = $event"
                            @update:startDate="startDate = $event"
                            @update:endDate="endDate = $event"
                            @reset="resetFilters"
                            @apply="applyFilters" />
                    </div>
                </template>
                <template #right>
                    <Pagination v-if="paginationData" :currentPage="paginationData.currentPage" :lastPage="paginationData.lastPage"
                        :per-page="paginationData.perPage" :per-page-options="paginationData.perPageOptions" :show-per-page-selector="true"
                        @changePage="fetchItems" @perPageChange="handlePerPageChange" />
                </template>
                <template #gear>
                    <CardFieldsGearMenu :card-fields="cardFields" :on-reset="resetCardFields" @toggle="toggleCardFieldVisible" />
                </template>
            </TableControlsBar>
            <MapperCardGrid
                class="mt-4"
                :items="data.items"
                :card-config="cardConfigMerged"
                :card-mapper="transactionCardMapper"
                title-field="title"
                :title-prefix="transactionCardTitlePrefix"
                :selected-ids="selectedIds"
                :show-checkbox="$store.getters.hasPermission('transactions_delete')"
                :footer-color-class="transactionFooterColorClass"
                @dblclick="onItemClick"
                @select-toggle="toggleSelectRow"
            />
        </div>
        <div v-else key="loader" class="min-h-64">
            <TableSkeleton v-if="viewMode === 'table'" />
            <CardsSkeleton v-else />
        </div>
    </transition>

        <SideModalDialog :showForm="modalDialog" :onclose="handleModalClose">
            <TransactionCreatePage v-if="modalDialog" :key="editingItem ? editingItem.id : 'new-transaction'"
                ref="transactioncreatepageForm" @saved="handleSaved" @saved-error="handleSavedError"
                @deleted="handleDeleted" @deleted-error="handleDeletedError" @close-request="closeModal"
                @copy-transaction="handleCopyTransaction" :editingItem="editingItem"
                :default-cash-id="cashRegisterId || null" :form-config="activeFormConfig" />
        </SideModalDialog>
        <AlertDialog :dialog="deleteDialog" :descr="`${$t('confirmDelete')} (${selectedIds.length})?`"
            :confirm-text="$t('delete')" :leave-text="$t('cancel')" @confirm="confirmDeleteItems"
            @leave="deleteDialog = false" />
    </div>
</template>

<script>
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import FiltersContainer from '@/views/components/app/forms/FiltersContainer.vue';
import Pagination from '@/views/components/app/buttons/Pagination.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';
import { VueDraggableNext } from 'vue-draggable-next';
import TransactionController from '@/api/TransactionController';
import TransactionDto from '@/dto/transaction/TransactionDto';
import TransactionCategoryController from '@/api/TransactionCategoryController';
import TransactionCreatePage from '@/views/pages/transactions/TransactionCreatePage.vue';
import CashRegisterController from '@/api/CashRegisterController';
import ProjectController from '@/api/ProjectController';
import TransactionsBalanceWrapper from '@/views/pages/transactions/TransactionsBalanceWrapper.vue';
import CheckboxFilter from '@/views/components/app/forms/CheckboxFilter.vue';
import ClientButtonCell from '@/views/components/app/buttons/ClientButtonCell.vue';
import SourceButtonCell from '@/views/components/app/buttons/SourceButtonCell.vue';
import TransactionTypeCell from '@/views/components/app/buttons/TransactionTypeCell.vue';
import TransactionAmountCell from '@/views/components/app/buttons/TransactionAmountCell.vue';
import { markRaw } from 'vue';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import BatchButton from '@/views/components/app/buttons/BatchButton.vue';
import batchActionsMixin from '@/mixins/batchActionsMixin';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import companyChangeMixin from '@/mixins/companyChangeMixin';
import { eventBus } from '@/eventBus';
import searchMixin from '@/mixins/searchMixin';
import { translateTransactionCategory } from '@/utils/transactionCategoryUtils';
import filtersMixin from '@/mixins/filtersMixin';
import cardFieldsVisibilityMixin from '@/mixins/cardFieldsVisibilityMixin';
import { highlightMatches } from '@/utils/searchUtils';
import TRANSACTION_FORM_PRESETS from '@/constants/transactionFormPresets';
import ViewModeToggle from '@/views/components/app/ViewModeToggle.vue';
import Card from '@/views/components/app/cards/Card.vue';
import CardFieldsButton from '@/views/components/app/cards/CardFieldsButton.vue';
import MapperCardGrid from '@/views/components/app/cards/MapperCardGrid.vue';
import CardsSkeleton from '@/views/components/app/CardsSkeleton.vue';
import TransactionFilters from '@/views/components/transactions/TransactionFilters.vue';
import CardFieldsGearMenu from '@/views/components/app/CardFieldsGearMenu.vue';
import { dayjsDateTime } from '@/utils/dateUtils';
import { formatNumber } from '@/utils/numberUtils';
import { getClientDisplayName } from '@/utils/displayUtils';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import exportTableMixin from '@/mixins/exportTableMixin';

export default {
    mixins: [modalMixin, notificationMixin, crudEventMixin, batchActionsMixin, getApiErrorMessageMixin, companyChangeMixin, searchMixin, filtersMixin, cardFieldsVisibilityMixin, exportTableMixin],
    components: { AlertDialog, PrimaryButton, SideModalDialog, Pagination, DraggableTable, TransactionCreatePage, TransactionsBalanceWrapper, ClientButtonCell, SourceButtonCell, TransactionTypeCell, TransactionAmountCell, BatchButton, FiltersContainer, TransactionFilters, CardFieldsGearMenu, CheckboxFilter, TableControlsBar, TableFilterButton, TableSkeleton, ViewModeToggle, Card, CardFieldsButton, MapperCardGrid, CardsSkeleton, draggable: VueDraggableNext },
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
                        onUpdated: () => this.fetchItems(this.data.current_page, false),
                        onDeleted: () => this.fetchItems(this.data.current_page, false)
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
            viewMode: this.$store.getters.transactionsViewMode || localStorage.getItem('transactions_viewMode') || 'table',
            cardFieldsKey: 'admin.transactions.cards',
            titleField: 'title'
        }
    },
    created() {
        this.$store.commit('SET_SETTINGS_OPEN', false);

        eventBus.on('global-search', this.handleSearch);
        
        // Восстанавливаем сохраненный режим просмотра из Vuex или localStorage
        const savedViewMode = this.$store.getters.transactionsViewMode || localStorage.getItem('transactions_viewMode');
        if (savedViewMode && (savedViewMode === 'table' || savedViewMode === 'cards')) {
            this.viewMode = savedViewMode;
        } else {
            this.viewMode = 'table';
        }
    },

    mounted() {
        this.fetchItems();
        this.allCashRegisters = this.$store.getters.cashRegisters;
        this.allProjects = this.$store.getters.activeProjects;
        if (this.$route.query.create === '1' && this.$route.query.recurring === '1') {
            const preset = { ...TRANSACTION_FORM_PRESETS.fullOutcome, options: { ...TRANSACTION_FORM_PRESETS.fullOutcome?.options, initialRecurring: true } };
            this.showModal(null, preset);
            this.$router.replace({ path: this.$route.path, query: {} });
        }
    },
    beforeUnmount() {
        eventBus.off('global-search', this.handleSearch);
    },
    methods: {
        translateTransactionCategory,
        openCreateIncomeModal() {
            this.showModal(null, TRANSACTION_FORM_PRESETS.fullIncome);
        },
        openCreateOutcomeModal() {
            this.showModal(null, TRANSACTION_FORM_PRESETS.fullOutcome);
        },
        updateBalace(silent = false) {
            if (this.$refs.balanceWrapper) {
                this.$refs.balanceWrapper.fetchItems(silent);
            }
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
                    return i.cashName ? `${i.cashName} (${i.cashCurrencySymbol})` : '-';
                case 'cashAmount':
                    const isPositive = i.type == 1;
                    return parseFloat(i.cashAmount || 0) * (isPositive ? 1 : -1);
                case 'origAmount':
                    return parseFloat(i.origAmount || 0);
                case 'exchangeRate':
                    if (!i.exchangeRate || i.origCurrencyId === i.cashCurrencyId) {
                        return null;
                    }
                    return `${i.exchangeRate} ${i.cashCurrencySymbol || ''}`.trim();
                case 'note':
                    if (!i.note) return '';
                    return search ? highlightMatches(i.note, search) : i.note;
                case 'dateUser':
                    return `${i.formatDate()} / ${i.userName}`;
                case 'categoryName':
                    return translateTransactionCategory(i.categoryName, this.$t) || '-';
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

                const per_page = this.perPage;

                const debtFilter = this.debtFilter === 'all' ? null : this.debtFilter;
                const categoryIds = this.categoryFilter.length > 0 ? this.categoryFilter.map(id => parseInt(id)) : null;
                const new_data = await TransactionController.getItems(
                    page,
                    this.cashRegisterId,
                    this.dateFilter,
                    null, // order_id
                    this.searchQuery,
                    this.transactionTypeFilter,
                    this.sourceFilter,
                    this.projectId,
                    per_page,
                    this.startDate,
                    this.endDate,
                    debtFilter,
                    categoryIds
                );

                // Обычная пагинация
                this.data = new_data;
            } catch (error) {
                this.showNotification(this.$t('errorGettingTransactionList'), error.message, true);
            }
            if (!silent) {
                this.loading = false;
            }
        },
        showModal(item = null, formConfig = null) {
            this.editingItem = null;
            this.currentFormConfig = formConfig || TRANSACTION_FORM_PRESETS.full;
            this.modalDialog = true;
            this.editingItem = item ? TransactionDto.fromObject(item) : null;
        },
        closeModal(skipScrollRestore = false) {
            modalMixin.methods.closeModal.call(this, skipScrollRestore);
            if (this.$route.params.id) {
                this.$router.replace({ name: 'Transactions' });
            }
        },
        beforeShowModal(item) {
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
                cash_id: this.cashRegisterId || undefined,
                date_filter_type: this.dateFilter,
                search: this.searchQuery || undefined,
                transaction_type: this.transactionTypeFilter || undefined,
                source: this.sourceFilter || undefined,
                project_id: this.projectId || undefined,
                start_date: this.startDate || undefined,
                end_date: this.endDate || undefined,
                is_debt: debtFilter,
                category_ids: categoryIds,
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
        // Переопределяем метод пакетного удаления для обновления баланса
        async confirmDeleteItems() {
            this.deleteDialog = false;
            if (!this.idsToDelete.length) return;

            this.loadingBatch = true;
            const errors = [];
            let deletedCount = 0;

            for (const id of this.idsToDelete) {
                try {
                    await this.controller.deleteItem(id);
                    deletedCount++;
                } catch (e) {
                    const messages = this.getApiErrorMessage?.(e) || [
                        e.message || "Ошибка",
                    ];
                    errors.push(`ID ${id}: ${messages[0]}`);
                }
            }

            if (deletedCount > 0) {
                this.showNotification?.(`Удалено ${deletedCount} элементов`);
                this.updateBalace();
                await this.$store.dispatch('invalidateCache', { type: 'clients' });
                await this.$store.dispatch('loadClients');
            }

            if (errors.length > 0) {
                this.showNotification?.("Ошибки при удалении", errors.join("\n"), true);
            }

            this.selectedIds = [];
            await this.fetchItems?.(1, false);
            this.loadingBatch = false;
            this.idsToDelete = [];
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
                    label: "Удалить",
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
                console.error('Ошибка загрузки категорий транзакций:', error);
                this.allTransactionCategories = [];
            }
        },
        handleCategoryFilterChange(value) {
            const selected = Array.isArray(value) ? value : [];
            this.categoryFilter = selected;
        },
        changeViewMode(mode) {
            this.viewMode = mode;
            localStorage.setItem('transactions_viewMode', mode);
            this.$store.commit('SET_TRANSACTIONS_VIEW_MODE', mode);
        },
        getTransactionTitle(transaction) {
            if (!transaction || !transaction.id) {
                return '№—';
            }
            return `№${transaction.id}`;
        },
        transactionCardTitlePrefix(item) {
            if (!item) return '';
            if (item.isTransfer == 1) {
                return '<i class="fas fa-exchange-alt text-[#3571A4] mr-1.5 flex-shrink-0" title="' + (this.$t('transfer') || 'Перевод') + '"></i>';
            }
            const isIncome = item.type == 1;
            const iconClass = isIncome ? 'fas fa-arrow-down text-green-600' : 'fas fa-arrow-up text-red-600';
            const title = isIncome ? (this.$t('income') || 'Приход') : (this.$t('outcome') || 'Расход');
            return `<i class="${iconClass} mr-1.5 flex-shrink-0" title="${title}"></i>`;
        },
        transactionFooterColorClass(item, fieldName) {
            if (fieldName === 'cashAmount' && item) {
                return item.type == 1 ? 'text-green-600' : 'text-red-600';
            }
            return null;
        },
        transactionCardMapper(item, fieldName) {
            if (!item) return '—';
            switch (fieldName) {
                case 'title':
                    return this.getTransactionTitle(item);
                case 'dateUser':
                    return item.formatDate ? `${item.formatDate()} / ${item.userName || '—'}` : '—';
                case 'type':
                    if (item.type == 1) return this.$t('income') || 'Приход';
                    if (item.type == 2) return this.$t('outcome') || 'Расход';
                    if (item.isTransfer == 1) return this.$t('transfer') || 'Перевод';
                    return '—';
                case 'source':
                    if (item.sourceType === 'sale') return this.$t('sale') || 'Продажа';
                    if (item.sourceType === 'order') return this.$t('order') || 'Заказ';
                    if (item.sourceType === 'other') return this.$t('other') || 'Другое';
                    return '—';
                case 'cashName':
                    return item.cashName ? `${item.cashName} (${item.cashCurrencySymbol || ''})` : '—';
                case 'client':
                    if (!item.client) return '—';
                    return getClientDisplayName(item.client) || '—';
                case 'projectName':
                    return item.projectName || '—';
                case 'categoryName':
                    return translateTransactionCategory(item.categoryName, this.$t) || '—';
                case 'note':
                    return item.note || '—';
                case 'cashAmount':
                    const isPositive = item.type == 1;
                    const amount = parseFloat(item.cashAmount || 0) * (isPositive ? 1 : -1);
                    const symbol = item.cashCurrencySymbol || '';
                    const formatted = formatNumber(amount, 2, true);
                    return symbol ? `${formatted} ${symbol}` : formatted;
                default:
                    return this.itemMapper(item, fieldName) ?? '—';
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
            if (!value) return '—';
            return dayjsDateTime(value);
        },
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
        transactionCardFieldsForSettings() {
            return [
                ...this.transactionCardFields,
                {
                    name: 'note',
                    label: this.$t('note') || 'Примечание',
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
                    label: this.$t('dateUser') || 'Дата / Пользователь',
                    icon: 'fas fa-calendar text-blue-600 text-xs',
                    type: 'string',
                    showLabel: false,
                    formatter: (value, item) => item.formatDate ? `${item.formatDate()} / ${item.userName || '—'}` : (value || '—')
                },
                {
                    name: 'type',
                    label: this.$t('type') || 'Тип',
                    icon: 'fas fa-exchange-alt text-purple-600 text-xs',
                    type: 'string',
                    showLabel: false,
                    formatter: (value, item) => {
                        if (item.type == 1) return this.$t('income') || 'Приход';
                        if (item.type == 2) return this.$t('outcome') || 'Расход';
                        if (item.isTransfer == 1) return this.$t('transfer') || 'Перевод';
                        return '—';
                    }
                },
                {
                    name: 'source',
                    label: this.$t('source') || 'Источник',
                    icon: 'fas fa-tag text-purple-600 text-xs',
                    type: 'string',
                    showLabel: false,
                    formatter: (value, item) => {
                        if (item.sourceType === 'sale') return this.$t('sale') || 'Продажа';
                        if (item.sourceType === 'order') return this.$t('order') || 'Заказ';
                        if (item.sourceType === 'other') return this.$t('other') || 'Другое';
                        return '—';
                    }
                },
                {
                    name: 'cashName',
                    label: this.$t('cashRegister') || 'Касса',
                    icon: 'fas fa-cash-register text-blue-600 text-xs',
                    type: 'string',
                    showLabel: false,
                    formatter: (value, item) => item.cashName ? `${item.cashName} (${item.cashCurrencySymbol || ''})` : '—'
                },
                {
                    name: 'client',
                    label: this.$t('customer') || 'Клиент',
                    icon: 'fas fa-user text-blue-600 text-xs',
                    type: 'object',
                    showLabel: false,
                    medium: true,
                    formatter: (value, item) => {
                        if (!item.client) return '—';
                        return getClientDisplayName(item.client) || this.$t('notSpecified') || '—';
                    }
                },
                {
                    name: 'projectName',
                    label: this.$t('project') || 'Проект',
                    icon: 'fas fa-folder text-purple-600 text-xs',
                    type: 'string',
                    showLabel: false,
                    formatter: (value) => value || '—'
                },
                {
                    name: 'categoryName',
                    label: this.$t('category') || 'Категория',
                    icon: 'fas fa-list text-gray-500 text-xs',
                    type: 'string',
                    showLabel: false,
                    formatter: (value) => translateTransactionCategory(value, this.$t) || '—'
                },
            ];
        },
        getTransactionFooterFields() {
            return (transaction) => {
                const isPositive = transaction.type == 1;
                const amount = parseFloat(transaction.cashAmount || 0) * (isPositive ? 1 : -1);
                const symbol = transaction.cashCurrencySymbol || '';
                
                return [
                    {
                        name: 'cashAmount',
                        label: this.$t('total') || 'Итого',
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
                { name: 'dateUser', label: 'dateUser', icon: 'fas fa-calendar text-[#3571A4]' },
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
        }
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