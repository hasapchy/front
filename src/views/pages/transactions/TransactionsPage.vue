<template>
    <div class="flex justify-between items-center mb-4">
        <div class="flex justify-start items-center">
            <PrimaryButton 
                :onclick="() => { showModal(null) }" 
                icon="fas fa-plus"
                :disabled="!$store.getters.hasPermission('transactions_create')">
            </PrimaryButton>
            <div class="ml-2">
                <select v-model="cashRegisterId" @change="() => fetchItems(1)">
                    <option value="">{{ $t('allCashRegisters') }}</option>
                    <template v-if="allCashRegisters.length">
                        <option v-for="parent in allCashRegisters" :key="parent.id" :value="parent.id">
                            {{ parent.name }} ({{ parent.currency_symbol || parent.currency_code || '' }})
                        </option>
                    </template>
                </select>
            </div>

            <!-- Фильтр по типу транзакции -->
            <div class="ml-2">
                <select v-model="transactionTypeFilter" @change="() => fetchItems(1)">
                    <option value="">{{ $t('allTransactionTypes') }}</option>
                    <option value="income">{{ $t('income') }}</option>
                    <option value="outcome">{{ $t('outcome') }}</option>
                    <option value="transfer">{{ $t('transfer') }}</option>
                </select>
            </div>

            <!-- Фильтр по источнику средств -->
            <div class="ml-2">
                <select v-model="sourceFilter" @change="() => fetchItems(1)">
                    <option value="">{{ $t('allSources') }}</option>
                    <option v-for="option in sourceOptions" :key="option.value" :value="option.value">
                        {{ option.label }}
                    </option>
                </select>
            </div>

            <!-- Фильтр по проектам -->
            <div class="ml-2">
                <select v-model="projectId" @change="() => fetchItems(1)">
                    <option value="">{{ $t('allProjects') }}</option>
                    <template v-if="allProjects.length">
                        <option v-for="project in allProjects" :key="project.id" :value="project.id">
                            {{ project.name }}
                        </option>
                    </template>
                </select>
            </div>

            <div class="ml-2">
                <select v-model="dateFilter" @change="() => fetchItems(1)">
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
            <div v-if="dateFilter === 'custom'" class="flex space-x-2 items-center ml-2">
                <input type="date" v-model="startDate" @change="() => fetchItems(1)" />
                <input type="date" v-model="endDate" @change="() => fetchItems(1)" />
            </div>

            <!-- Кнопка сброса фильтров -->
            <div v-if="hasActiveFilters" class="ml-2">
                <PrimaryButton 
                    :onclick="resetFilters"
                    icon="fas fa-filter-circle-xmark"
                    :isLight="true">
                </PrimaryButton>
            </div>
        </div>
        <Pagination v-if="data != null" :currentPage="data.currentPage" :lastPage="data.lastPage"
            :per-page="perPage" :per-page-options="perPageOptions" :show-per-page-selector="true"
            storage-key="transactionsPerPage"
            @changePage="fetchItems" @perPageChange="handlePerPageChange" />
    </div>
    <div class="flex gap-4 mb-4">
        <div class="flex-1">
            <TransactionsBalance ref="balanceRef" :cash-register-id="cashRegisterId || null" :start-date="startDate"
                :end-date="endDate" :date-filter="dateFilter" :transaction-type-filter="transactionTypeFilter" :source-filter="sourceFilter" />
        </div>
        <div class="w-auto ml-auto">
            <TransactionsDebtBalance ref="debtBalanceRef" :cash-register-id="cashRegisterId || null" :start-date="startDate"
                :end-date="endDate" :date-filter="dateFilter" :transaction-type-filter="transactionTypeFilter" :source-filter="sourceFilter" />
        </div>
    </div>
    <BatchButton v-if="selectedIds.length" :selected-ids="selectedIds" :batch-actions="getBatchActions()" />
    <transition name="fade" mode="out-in">
        <div v-if="data != null && !loading" key="table">
            <DraggableTable table-key="admin.transactions" :columns-config="translatedColumnsConfig"
                :table-data="data.items" :item-mapper="itemMapper" @selectionChange="selectedIds = $event"
                :onItemClick="(i) => { showModal(i) }" />
        </div>
        <div v-else key="loader" class="flex justify-center items-center h-64">
            <i class="fas fa-spinner fa-spin text-2xl"></i><br>
        </div>
    </transition>
    
    <SideModalDialog :showForm="modalDialog" :onclose="handleModalClose">
        <TransactionCreatePage ref="transactioncreatepageForm" @saved="handleSaved" @saved-error="handleSavedError"
            @deleted="handleDeleted" @deleted-error="handleDeletedError" @close-request="closeModal"
            @copy-transaction="handleCopyTransaction"
            :editingItem="editingItem" :default-cash-id="cashRegisterId || null" />
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
import Pagination from '@/views/components/app/buttons/Pagination.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import TransactionController from '@/api/TransactionController';
import TransactionCreatePage from '@/views/pages/transactions/TransactionCreatePage.vue';
import CashRegisterController from '@/api/CashRegisterController';
import ProjectController from '@/api/ProjectController';
import TransactionsBalance from '@/views/pages/transactions/TransactionsBalance.vue';
import TransactionsDebtBalance from '@/views/pages/transactions/TransactionsDebtBalance.vue';
import ClientButtonCell from '@/views/components/app/buttons/ClientButtonCell.vue';
import { markRaw } from 'vue';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import BatchButton from '@/views/components/app/buttons/BatchButton.vue';
import batchActionsMixin from '@/mixins/batchActionsMixin';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import tableTranslationMixin from '@/mixins/tableTranslationMixin';
import companyChangeMixin from '@/mixins/companyChangeMixin';
import { eventBus } from '@/eventBus';

export default {
    mixins: [modalMixin, notificationMixin, crudEventMixin, batchActionsMixin, getApiErrorMessageMixin, tableTranslationMixin, companyChangeMixin],
    components: { NotificationToast, AlertDialog, PrimaryButton, SideModalDialog, Pagination, DraggableTable, TransactionCreatePage, TransactionsBalance, TransactionsDebtBalance, ClientButtonCell, BatchButton },
    data() {
        return {
            data: null,
            loading: false,
            selectedIds: [],
            controller: TransactionController,
            showStatusSelect: false, // транзакции не имеют статусов
            allCashRegisters: [],
            cashRegisterId: '',
            dateFilter: 'all_time',
            startDate: null,
            endDate: null,
            transactionTypeFilter: '',
            sourceFilter: '',
            projectId: '',
            allProjects: [],
            savedSuccessText: this.$t('transactionSuccessfullyAdded'),
            savedErrorText: this.$t('errorSavingTransaction'),
            deletedSuccessText: this.$t('transactionSuccessfullyDeleted'),
            deletedErrorText: this.$t('errorDeletingTransaction'),
            columnsConfig: [
                { name: 'select', label: '#', size: 15 },
                { name: 'id', label: 'number', size: 60 },
                { name: 'type', label: 'type', html: true },
                { name: 'source', label: 'source', html: true },
                { name: 'cashName', label: 'cashRegister' },
                { name: 'cashAmount', label: 'amount', html: true },
                { name: 'origAmount', label: 'originalAmount' },
                { name: 'categoryName', label: 'category' },
                { name: 'note', label: 'note' },
                { name: 'projectName', label: 'project' },
                {
                    name: 'client',
                    label: 'customer',
                    component: markRaw(ClientButtonCell),
                    props: (item) => ({
                        client: item.client,

                    })
                },
                { name: 'dateUser', label: 'date' },
            ],
            sourceOptions: [
                { value: 'sale', label: this.$t('sale') },
                { value: 'order', label: this.$t('order') },
                { value: 'other', label: this.$t('other') },
            ],
            perPage: 10,
            perPageOptions: [10, 25, 50, 100]
        }
    },
    created() {
        this.$store.commit('SET_SETTINGS_OPEN', false);

        eventBus.on('global-search', this.handleSearch);
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
        updateBalace() {
            if (this.$refs.balanceRef) {
                this.$refs.balanceRef.fetchItems();
            }
            if (this.$refs.debtBalanceRef) {
                this.$refs.debtBalanceRef.fetchItems();
            }
        },
        handleModalClose() {
            const formRef = this.$refs.transactioncreatepageForm;
            if (formRef && formRef.handleCloseRequest) {
                formRef.handleCloseRequest();
            } else {
                this.closeModal();
            }
        },
        itemMapper(i, c) {
            switch (c) {
                case 'type':
                    return i.typeCell();
                case 'source':
                    return i.sourceCell();
                case 'debt':
                    return i.debtCell();
                case 'cashName':
                    return i.cashName ? `${i.cashName} (${i.cashCurrencySymbol})` : '-';
                case 'cashAmount':
                    return i.cashAmountData();
                case 'origAmount':
                    return i.origAmountData();
                case 'client':
                    if (!i.client) return '';
                    const name = i.client.fullName();
                    const firstPhone = i.client.phones?.[0]?.phone;
                    return firstPhone
                        ? `${name} (${firstPhone})`
                        : name;
                case 'dateUser':
                    return `${i.formatDate()} / ${i.userName}`;
                default:
                    return i[c];
            }
        },
        handleSearch(query) {
            this.$store.dispatch('setSearchQuery', query);
            this.fetchItems(1, false);
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
                const new_data = await TransactionController.getItems(
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
                    this.endDate
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
        showModal(item = null) {
            this.editingItem = null;
            if (item?.isTransfer === 1 || item?.isTransfer === true) {
                this.showNotification(this.$t('cannotEditTransfer'), this.$t('transferTransaction'), true);
                return;
            }
            this.modalDialog = true;
            this.editingItem = item;
        },
        resetFilters() {
            this.cashRegisterId = '';
            this.transactionTypeFilter = '';
            this.sourceFilter = '';
            this.projectId = '';
            this.dateFilter = 'all_time';
            this.startDate = null;
            this.endDate = null;
            this.fetchItems();
        },
        // Переопределяем методы из crudEventMixin для обновления баланса
        handleSaved() {
            this.showNotification(
                this.savedSuccessText || "Успешно сохранено",
                "",
                false
            );
            this.fetchItems(this.data?.currentPage || 1, true);
            this.updateBalace(); // Обновляем баланс касс
            this.closeModal();
        },
        handleDeleted() {
            this.showNotification(
                this.deletedSuccessText || "Успешно удалено",
                "",
                false
            );
            this.fetchItems(this.data?.currentPage || 1, true);
            this.updateBalace(); // Обновляем баланс касс
            this.closeModal();
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
                this.updateBalace(); // Обновляем баланс касс после пакетного удаления
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
                return item && item.isTransfer !== 1 && item.isTransfer !== true;
            });
            
            const hasTransfers = this.selectedIds.length > nonTransferIds.length;
            
            if (hasTransfers) {
                this.showNotification(
                    this.$t('cannotDeleteTransfers'), 
                    this.$t('transferTransactionsCannotBeDeleted'), 
                    true
                );
            }
            
            return [
                {
                    label: "Удалить",
                    icon: "fas fa-trash",
                    type: "danger",
                    action: nonTransferIds.length > 0 ? this.deleteItems : null,
                    disabled: this.loadingBatch || nonTransferIds.length === 0,
                },
            ];
        },
    },
    computed: {
        searchQuery() {
            return this.$store.state.searchQuery;
        },
        hasActiveFilters() {
            return this.cashRegisterId !== '' ||
                   this.transactionTypeFilter !== '' ||
                   this.sourceFilter !== '' ||
                   this.projectId !== '' ||
                   this.dateFilter !== 'all_time' ||
                   this.startDate !== null ||
                   this.endDate !== null;
        }
    },
    watch: {
        // Отслеживаем изменения касс в store
        '$store.state.cashRegisters'(newVal) {
            this.allCashRegisters = newVal;
        },
        // Отслеживаем изменения проектов в store
        '$store.state.projects'(newVal) {
            this.allProjects = newVal;
        }
    },
}
</script>