<template>
    <div class="flex justify-between items-center mb-4">
        <div class="flex justify-start items-center">
            <PrimaryButton :onclick="() => { showModal(null) }" icon="fas fa-plus">{{ $t('addTransaction') }}
            </PrimaryButton>
            <div class="mx-4">
                <select v-model="cashRegisterId" @change="fetchItems">
                    <option value="">{{ $t('allCashRegisters') }}</option>
                    <template v-if="allCashRegisters.length">
                        <option v-for="parent in allCashRegisters" :key="parent.id" :value="parent.id">
                            {{ parent.name }} ({{ parent.currency_symbol || parent.currency_code || '' }})
                        </option>
                    </template>
                </select>
            </div>

            <!-- Фильтр по типу транзакции -->
            <div class="mx-2">
                <select v-model="transactionTypeFilter" @change="fetchItems" class="w-full p-2 border rounded">
                    <option value="">{{ $t('allTransactionTypes') }}</option>
                    <option value="income">{{ $t('income') }}</option>
                    <option value="outcome">{{ $t('outcome') }}</option>
                    <option value="transfer">{{ $t('transfer') }}</option>
                </select>
            </div>

            <!-- Фильтр по источнику средств -->
            <div class="mx-2">
                <CheckboxFilter 
                    v-model="sourceFilter"
                    :options="sourceOptions"
                    placeholder="allSources"
                    @change="fetchItems"
                />
            </div>

            <div class="">
                <select v-model="dateFilter" @change="fetchItems" class="w-full p-2 pl-10 border rounded">
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
            <div v-if="dateFilter === 'custom'" class="flex space-x-2 items-center ml-4">
                <input type="date" v-model="startDate" @change="fetchItems" class="w-full p-2 border rounded" />
                <input type="date" v-model="endDate" @change="fetchItems" class="w-full p-2 border rounded" />
            </div>

            <!-- Кнопка сброса фильтров -->
            <div class="ml-4">
                <PrimaryButton 
                    :onclick="resetFilters"
                    icon="fas fa-times"
                    :isLight="true">
                    {{ $t('resetFilters') }}
                </PrimaryButton>
            </div>
        </div>
        <Pagination v-if="data != null" :currentPage="data.currentPage" :lastPage="data.lastPage"
            @changePage="fetchItems" />
    </div>
    <TransactionsBalance ref="balanceRef" :cash-register-id="cashRegisterId || null" :start-date="startDate"
        :end-date="endDate" :date-filter="dateFilter" :transaction-type-filter="transactionTypeFilter" :source-filter="sourceFilter" />
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
import TransactionsBalance from '@/views/pages/transactions/TransactionsBalance.vue';
import ClientButtonCell from '@/views/components/app/buttons/ClientButtonCell.vue';
import { markRaw } from 'vue';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import BatchButton from '@/views/components/app/buttons/BatchButton.vue';
import batchActionsMixin from '@/mixins/batchActionsMixin';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import { eventBus } from '@/eventBus';
import CheckboxFilter from '@/views/components/app/forms/CheckboxFilter.vue';

export default {
    mixins: [modalMixin, notificationMixin, batchActionsMixin, getApiErrorMessageMixin],
    components: { NotificationToast, AlertDialog, PrimaryButton, SideModalDialog, Pagination, DraggableTable, TransactionCreatePage, TransactionsBalance, ClientButtonCell, BatchButton, CheckboxFilter },
    data() {
        return {
            data: null,
            loading: false,
            selectedIds: [],
            controller: TransactionController,
            allCashRegisters: [],
            cashRegisterId: '',
            dateFilter: 'all_time',
            startDate: null,
            endDate: null,
            transactionTypeFilter: '',
            sourceFilter: [],
            columnsConfig: [
                { name: 'select', label: '#', size: 15 },
                { name: 'id', label: 'number', size: 60 },
                { name: 'type', label: 'type', html: true },
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
                { value: 'project', label: this.$t('project') },
                { value: 'sale', label: this.$t('sale') },
                { value: 'order', label: this.$t('order') },
                { value: 'other', label: this.$t('other') },
            ]
        }
    },
    created() {
        this.fetchItems();
        this.fetchAllCashRegisters();
        this.$store.commit('SET_SETTINGS_OPEN', false);

        // Слушаем события поиска через eventBus
        eventBus.on('global-search', this.handleSearch);
    },
    beforeUnmount() {
        // Удаляем слушатель события
        eventBus.off('global-search', this.handleSearch);
    },
    methods: {
        updateBalace() {
            this.$refs.balanceRef.fetchItems();
        },
        handleModalClose() {
            // Проверяем, есть ли изменения в форме
            const formRef = this.$refs.transactioncreatepageForm;
            if (formRef && formRef.handleCloseRequest) {
                formRef.handleCloseRequest();
            } else {
                this.closeModal();
            }
        },
        async fetchAllCashRegisters() {
            this.allCashRegisters = await CashRegisterController.getAllItems();
        },
        itemMapper(i, c) {
            switch (c) {
                case 'type':
                    return i.typeCell();
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
            // Обновляем store напрямую
            this.$store.dispatch('setSearchQuery', query);
            this.fetchItems(1, false);
        },
        async fetchItems(page = 1, silent = false) {
            if (!silent) {
                this.loading = true;
            }
            try {
                let new_data;
                if (this.dateFilter === 'custom') {
                    new_data = await TransactionController.getItems(
                        page,
                        this.cashRegisterId,
                        this.dateFilter,
                        null, // order_id
                        this.searchQuery,
                        this.transactionTypeFilter,
                        this.sourceFilter
                    );
                } else {
                    new_data = await TransactionController.getItems(
                        page,
                        this.cashRegisterId,
                        this.dateFilter,
                        null, // order_id
                        this.searchQuery,
                        this.transactionTypeFilter,
                        this.sourceFilter
                    );
                }
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
            if (item?.isTransfer === 1) {
                this.showNotification(this.$t('cannotEditTransfer'), this.$t('transferTransaction'), true);
                return;
            }
            this.modalDialog = true;
            this.editingItem = item;
        },
        handleSaved() {
            this.showNotification(this.$t('transactionSuccessfullyAdded'), '', false);
            this.fetchItems(this.data?.currentPage || 1, true);
            this.updateBalace();
            this.closeModal();
        },
        handleSavedError(m) {
            this.showNotification(this.$t('errorSavingTransaction'), m, true);
        },
        handleDeleted() {
            this.showNotification(this.$t('transactionSuccessfullyDeleted'), '', false);
            this.fetchItems(this.data?.currentPage || 1, true);
            this.updateBalace();
            this.closeModal();
        },
        handleDeletedError(m) {
            this.showNotification(this.$t('errorDeletingTransaction'), m, true);
        },
        resetFilters() {
            this.cashRegisterId = '';
            this.transactionTypeFilter = '';
            this.sourceFilter = [];
            this.dateFilter = 'all_time';
            this.startDate = null;
            this.endDate = null;
            this.fetchItems();
        }
    },
    computed: {
        searchQuery() {
            return this.$store.state.searchQuery;
        },
        translatedColumnsConfig() {
            return this.columnsConfig.map(column => ({
                ...column,
                label: column.label === '#' ? '#' : this.$t(column.label)
            }));
        }
    },
}
</script>