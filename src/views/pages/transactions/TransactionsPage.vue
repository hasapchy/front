<template>
    <!-- ✅ Один компонент вместо двух - один API запрос вместо двух! -->
    <TransactionsBalanceWrapper ref="balanceWrapper" :cash-register-id="cashRegisterId || null" :start-date="startDate"
        :end-date="endDate" :date-filter="dateFilter" :transaction-type-filter="transactionTypeFilter"
        :source-filter="sourceFilter" @balance-click="handleBalanceClick" />
    <transition name="fade" mode="out-in">
        <!-- Табличный режим -->
        <div v-if="data != null && !loading && viewMode !== 'cards'" key="table">
            <DraggableTable ref="draggableTable" table-key="admin.transactions" :columns-config="columnsConfig"
                :table-data="data.items" :item-mapper="itemMapper" @selectionChange="selectedIds = $event"
                :onItemClick="onItemClick">
                <template #tableControlsBar="{ resetColumns, columns, toggleVisible, log }">
                    <TableControlsBar
                        :show-pagination="true"
                        :pagination-data="data ? { currentPage: data.currentPage, lastPage: data.lastPage, perPage: perPage, perPageOptions: perPageOptions } : null"
                        :on-page-change="fetchItems" :on-per-page-change="handlePerPageChange"
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
                                
                                <ViewModeToggle :view-mode="viewMode" :show-cards="true" @change="changeViewMode" />
                                
                                <FiltersContainer
                                    :has-active-filters="hasActiveFilters"
                                    :active-filters-count="getActiveFiltersCount()"
                                    @reset="resetFilters"
                                    @apply="applyFilters">
                                        <div>
                                            <label class="block mb-2 text-xs font-semibold">{{ $t('cashRegister') || 'Касса' }}</label>
                                            <select v-model="cashRegisterId" class="w-full">
                                                <option value="">{{ $t('allCashRegisters') }}</option>
                                                <template v-if="allCashRegisters.length">
                                                    <option v-for="parent in allCashRegisters" :key="parent.id" :value="parent.id">
                                                        {{ parent.name }} ({{ parent.currencySymbol || '' }})
                                                    </option>
                                                </template>
                                            </select>
                                        </div>

                                        <div>
                                            <label class="block mb-2 text-xs font-semibold">{{ $t('transactionType') || 'Тип транзакции' }}</label>
                                            <select v-model="transactionTypeFilter" class="w-full">
                                                <option value="">{{ $t('allTransactionTypes') }}</option>
                                                <option value="income">{{ $t('income') }}</option>
                                                <option value="outcome">{{ $t('outcome') }}</option>
                                                <option value="transfer">{{ $t('transfer') }}</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label class="block mb-2 text-xs font-semibold">{{ $t('source') || 'Источник' }}</label>
                                            <select v-model="sourceFilter" class="w-full">
                                                <option value="">{{ $t('allSources') }}</option>
                                                <option v-for="option in sourceOptions" :key="option.value" :value="option.value">
                                                    {{ option.label }}
                                                </option>
                                            </select>
                                        </div>

                                        <div>
                                            <label class="block mb-2 text-xs font-semibold">{{ $t('project') || 'Проект' }}</label>
                                            <select v-model="projectId" class="w-full">
                                                <option value="">{{ $t('allProjects') }}</option>
                                                <template v-if="allProjects.length">
                                                    <option v-for="project in allProjects" :key="project.id" :value="project.id">
                                                        {{ project.name }}
                                                    </option>
                                                </template>
                                            </select>
                                        </div>

                                        <div>
                                            <label class="block mb-2 text-xs font-semibold">{{ $t('debtFilter') || 'Фильтр по долгам' }}</label>
                                            <select v-model="debtFilter" class="w-full">
                                                <option value="all">{{ $t('allTransactions') }}</option>
                                                <option value="false">{{ $t('nonDebtTransactions') }}</option>
                                                <option value="true">{{ $t('debtsOnly') }}</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label class="block mb-2 text-xs font-semibold">{{ $t('dateFilter') || 'Период' }}</label>
                                            <select v-model="dateFilter" class="w-full">
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
                                                <input type="date" v-model="startDate" class="w-full" />
                                            </div>
                                            <div>
                                                <label class="block mb-2 text-xs font-semibold">{{ $t('endDate') || 'Конечная дата' }}</label>
                                                <input type="date" v-model="endDate" class="w-full" />
                                            </div>
                                        </div>
                                </FiltersContainer>
                            </div>
                        </template>

                        <template #right>
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

        <!-- Карточный режим -->
        <div v-else-if="data != null && !loading && viewMode === 'cards'" key="cards" class="cards-view-container">
            <div class="mb-4">
                <TableControlsBar
                    :show-pagination="true"
                    :pagination-data="data ? { currentPage: data.currentPage, lastPage: data.lastPage, perPage: perPage, perPageOptions: perPageOptions } : null"
                    :on-page-change="fetchItems" :on-per-page-change="handlePerPageChange">
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
                            
                            <ViewModeToggle :view-mode="viewMode" :show-cards="true" @change="changeViewMode" />
                            
                            <FiltersContainer
                                :has-active-filters="hasActiveFilters"
                                :active-filters-count="getActiveFiltersCount()"
                                @reset="resetFilters"
                                @apply="applyFilters">
                                    <div>
                                        <label class="block mb-2 text-xs font-semibold">{{ $t('cashRegister') || 'Касса' }}</label>
                                        <select v-model="cashRegisterId" class="w-full">
                                            <option value="">{{ $t('allCashRegisters') }}</option>
                                            <template v-if="allCashRegisters.length">
                                                <option v-for="parent in allCashRegisters" :key="parent.id" :value="parent.id">
                                                    {{ parent.name }} ({{ parent.currencySymbol || '' }})
                                                </option>
                                            </template>
                                        </select>
                                    </div>

                                    <div>
                                        <label class="block mb-2 text-xs font-semibold">{{ $t('transactionType') || 'Тип транзакции' }}</label>
                                        <select v-model="transactionTypeFilter" class="w-full">
                                            <option value="">{{ $t('allTransactionTypes') }}</option>
                                            <option value="income">{{ $t('income') }}</option>
                                            <option value="outcome">{{ $t('outcome') }}</option>
                                            <option value="transfer">{{ $t('transfer') }}</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label class="block mb-2 text-xs font-semibold">{{ $t('source') || 'Источник' }}</label>
                                        <select v-model="sourceFilter" class="w-full">
                                            <option value="">{{ $t('allSources') }}</option>
                                            <option v-for="option in sourceOptions" :key="option.value" :value="option.value">
                                                {{ option.label }}
                                            </option>
                                        </select>
                                    </div>

                                    <div>
                                        <label class="block mb-2 text-xs font-semibold">{{ $t('project') || 'Проект' }}</label>
                                        <select v-model="projectId" class="w-full">
                                            <option value="">{{ $t('allProjects') }}</option>
                                            <template v-if="allProjects.length">
                                                <option v-for="project in allProjects" :key="project.id" :value="project.id">
                                                    {{ project.name }}
                                                </option>
                                            </template>
                                        </select>
                                    </div>

                                    <div>
                                        <label class="block mb-2 text-xs font-semibold">{{ $t('debtFilter') || 'Фильтр по долгам' }}</label>
                                        <select v-model="debtFilter" class="w-full">
                                            <option value="all">{{ $t('allTransactions') }}</option>
                                            <option value="false">{{ $t('nonDebtTransactions') }}</option>
                                            <option value="true">{{ $t('debtsOnly') }}</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label class="block mb-2 text-xs font-semibold">{{ $t('dateFilter') || 'Период' }}</label>
                                        <select v-model="dateFilter" class="w-full">
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
                                            <input type="date" v-model="startDate" class="w-full" />
                                        </div>
                                        <div>
                                            <label class="block mb-2 text-xs font-semibold">{{ $t('endDate') || 'Конечная дата' }}</label>
                                            <input type="date" v-model="endDate" class="w-full" />
                                        </div>
                                    </div>
                            </FiltersContainer>
                        </div>
                    </template>
                    <template #right>
                        <Pagination v-if="data != null" :currentPage="data.currentPage" :lastPage="data.lastPage"
                            :per-page="perPage" :per-page-options="perPageOptions" :show-per-page-selector="true"
                            @changePage="fetchItems" @perPageChange="handlePerPageChange" />
                    </template>
                </TableControlsBar>
            </div>

            <div class="cards-grid">
                <Card
                    v-for="transaction in data.items"
                    :key="transaction.id"
                    :item="transaction"
                    :is-selected="selectedIds.includes(transaction.id)"
                    :title="`№${transaction.id}`"
                    :fields="transactionCardFields"
                    :footer-fields="getTransactionFooterFields(transaction)"
                    :note-field="transaction.note ? 'note' : null"
                    @dblclick="onItemClick"
                    @select-toggle="toggleSelectRow"
                />
            </div>
        </div>

        <div v-else key="loader" class="flex justify-center items-center h-64">
            <SpinnerIcon />
        </div>
    </transition>

    <SideModalDialog :showForm="modalDialog" :onclose="handleModalClose">
        <TransactionCreatePage v-if="modalDialog" :key="editingItem ? editingItem.id : 'new-transaction'" ref="transactioncreatepageForm" @saved="handleSaved"
            @saved-error="handleSavedError" @deleted="handleDeleted" @deleted-error="handleDeletedError"
            @close-request="closeModal" @copy-transaction="handleCopyTransaction" :editingItem="editingItem"
            :default-cash-id="cashRegisterId || null" :form-config="activeFormConfig" />
    </SideModalDialog>
    <NotificationToast :title="notificationTitle" :subtitle="notificationSubtitle" :show="notification"
        :is-danger="notificationIsDanger" @close="closeNotification" />
    <AlertDialog :dialog="deleteDialog" :descr="`${$t('confirmDelete')} (${selectedIds.length})?`"
        :confirm-text="$t('delete')" :leave-text="$t('cancel')" @confirm="confirmDeleteItems"
        @leave="deleteDialog = false" />
</template>

<script>
import NotificationToast from '@/views/components/app/dialog/NotificationToast.vue';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import FiltersContainer from '@/views/components/app/forms/FiltersContainer.vue';
import Pagination from '@/views/components/app/buttons/Pagination.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';
import { VueDraggableNext } from 'vue-draggable-next';
import TransactionController from '@/api/TransactionController';
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
import { highlightMatches } from '@/utils/searchUtils';
import TRANSACTION_FORM_PRESETS from '@/constants/transactionFormPresets';
import ViewModeToggle from '@/views/components/app/ViewModeToggle.vue';
import Card from '@/views/components/app/cards/Card.vue';
import { dayjsDateTime } from '@/utils/dateUtils';
import { formatNumber } from '@/utils/numberUtils';

export default {
    mixins: [modalMixin, notificationMixin, crudEventMixin, batchActionsMixin, getApiErrorMessageMixin, companyChangeMixin, searchMixin, filtersMixin],
    components: { NotificationToast, AlertDialog, PrimaryButton, SideModalDialog, Pagination, DraggableTable, TransactionCreatePage, TransactionsBalanceWrapper, ClientButtonCell, SourceButtonCell, TransactionTypeCell, TransactionAmountCell, BatchButton, FiltersContainer, CheckboxFilter, TableControlsBar, TableFilterButton, ViewModeToggle, Card, draggable: VueDraggableNext },
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
                { name: 'id', label: 'number', size: 60 },
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
            viewMode: this.$store.getters.transactionsViewMode || localStorage.getItem('transactions_viewMode') || 'table'
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
        // Кассы и проекты загружаются автоматически через store при установке компании
        this.allCashRegisters = this.$store.getters.cashRegisters;
        this.allProjects = this.$store.getters.activeProjects;
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
        updateBalace() {
            // Обновляем баланс кассы и кредитов (один компонент для обоих)
            if (this.$refs.balanceWrapper) {
                this.$refs.balanceWrapper.fetchItems();
            }
        },
        itemMapper(i, c) {
            const search = this.searchQuery;

            switch (c) {
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
            this.editingItem = item;
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
        async handleCompanyChanged(companyId) {
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

            // ✅ Перезагружаем данные со страницы 1
            await this.fetchItems(1, false);

            // ✅ Обновляем баланс
            this.updateBalace();

            // ✅ Уведомляем пользователя о смене компании
            this.$store.dispatch('showNotification', {
                title: 'Компания изменена',
                isDanger: false
            });
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
        transactionCardFields() {
            return [
                {
                    name: 'dateUser',
                    label: this.$t('dateUser') || 'Дата / Пользователь',
                    icon: 'fas fa-calendar text-blue-600 text-xs',
                    type: 'string',
                    showLabel: false,
                    formatter: (value, item) => {
                        return item.formatDate ? `${item.formatDate()} / ${item.userName || '—'}` : (value || '—');
                    }
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
                    formatter: (value, item) => {
                        return item.cashName ? `${item.cashName} (${item.cashCurrencySymbol || ''})` : '—';
                    }
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
                        if (typeof item.client.fullName === 'function') {
                            return item.client.fullName();
                        }
                        const firstName = item.client.firstName || '';
                        const lastName = item.client.lastName || '';
                        const name = `${firstName} ${lastName}`.trim();
                        return name || this.$t('notSpecified') || '—';
                    }
                },
                {
                    name: 'projectName',
                    label: this.$t('project') || 'Проект',
                    icon: 'fas fa-folder text-purple-600 text-xs',
                    type: 'string',
                    showLabel: false,
                    formatter: (value) => {
                        return value || '—';
                    }
                },
                {
                    name: 'categoryName',
                    label: this.$t('category') || 'Категория',
                    icon: 'fas fa-list text-gray-500 text-xs',
                    type: 'string',
                    showLabel: false,
                    formatter: (value) => {
                        return translateTransactionCategory(value, this.$t) || '—';
                    }
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