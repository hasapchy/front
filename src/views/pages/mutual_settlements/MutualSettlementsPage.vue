<template>
    <div class="flex justify-between items-center mb-4">
        <div class="flex justify-start items-center">
            <div class="ml-2">
                <select v-model="clientId" @change="() => fetchItems(1)">
                    <option value="">{{ $t('allClients') }}</option>
                    <template v-if="allClients.length">
                        <option v-for="client in allClients" :key="client.id" :value="client.id">
                            {{ client.first_name }} {{ client.last_name }}
                        </option>
                    </template>
                </select>
            </div>

            <!-- Фильтр по датам -->
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
            @changePage="fetchItems" @perPageChange="handlePerPageChange" />
    </div>

        <!-- Балансы клиентов -->
        <MutualSettlementsBalanceWrapper 
            :data="clientBalances" 
            :loading="clientBalancesLoading" />

    <transition name="fade" mode="out-in">
        <div v-if="data != null && !loading" key="table">
            <DraggableTable table-key="admin.mutual_settlements" :columns-config="translatedColumnsConfig"
                :table-data="data.items" :item-mapper="itemMapper" @selectionChange="selectedIds = $event"
                :onItemClick="(i) => { showModal(i) }" />
        </div>
        <div v-else key="loader" class="flex justify-center items-center h-64">
            <i class="fas fa-spinner fa-spin text-2xl"></i><br>
        </div>
    </transition>
    
    <SideModalDialog :showForm="modalDialog" :onclose="handleModalClose">
        <TransactionCreatePage v-if="modalDialog" ref="transactioncreatepageForm" @saved="handleSaved" @saved-error="handleSavedError"
            @deleted="handleDeleted" @deleted-error="handleDeletedError" @close-request="closeModal"
            @copy-transaction="handleCopyTransaction"
            :editingItem="editingItem" :default-cash-id="null" />
    </SideModalDialog>
    <NotificationToast :title="notificationTitle" :subtitle="notificationSubtitle" :show="notification"
        :is-danger="notificationIsDanger" @close="closeNotification" />
</template>

<script>
import NotificationToast from '@/views/components/app/dialog/NotificationToast.vue';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import Pagination from '@/views/components/app/buttons/Pagination.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import TransactionController from '@/api/TransactionController';
import ClientController from '@/api/ClientController';
import TransactionCreatePage from '@/views/pages/transactions/TransactionCreatePage.vue';
import { markRaw } from 'vue';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import tableTranslationMixin from '@/mixins/tableTranslationMixin';
import companyChangeMixin from '@/mixins/companyChangeMixin';
import ClientButtonCell from '@/views/components/app/buttons/ClientButtonCell.vue';
import SourceButtonCell from '@/views/components/app/buttons/SourceButtonCell.vue';
import MutualSettlementsBalanceWrapper from './MutualSettlementsBalanceWrapper.vue';

export default {
    mixins: [modalMixin, notificationMixin, crudEventMixin, getApiErrorMessageMixin, tableTranslationMixin, companyChangeMixin],
    components: { NotificationToast, PrimaryButton, SideModalDialog, Pagination, DraggableTable, TransactionCreatePage, ClientButtonCell, SourceButtonCell, MutualSettlementsBalanceWrapper },
    data() {
        return {
            controller: TransactionController,
            cacheInvalidationType: 'transactions',
            allClients: [],
            clientBalances: [],
            clientBalancesLoading: false,
            clientId: '',
            dateFilter: 'all_time',
            startDate: null,
            endDate: null,
            savedSuccessText: this.$t('transactionSuccessfullyAdded'),
            savedErrorText: this.$t('errorSavingTransaction'),
            deletedSuccessText: this.$t('transactionSuccessfullyDeleted'),
            deletedErrorText: this.$t('errorDeletingTransaction'),
            columnsConfig: [
                { name: 'select', label: '#', size: 15 },
                { name: 'id', label: 'number', size: 60 },
                { name: 'debtType', label: 'type', html: true },
                {
                    name: 'client',
                    label: 'customer',
                    component: markRaw(ClientButtonCell),
                    props: (item) => ({
                        client: item.client,
                        searchQuery: null
                    })
                },
                { name: 'clientBalance', label: 'balance', html: true },
                { name: 'clientImpact', label: 'impact', html: true },
                {
                    name: 'source',
                    label: 'source',
                    component: markRaw(SourceButtonCell),
                    props: (item) => ({
                        sourceType: item.sourceType,
                        sourceId: item.sourceId,
                        transaction: item
                    })
                },
                { name: 'note', label: 'note', html: true, size: 200 },
                { name: 'categoryName', label: 'category' },
                { name: 'dateUser', label: 'date' },
            ]
        }
    },
    created() {
        this.$store.commit('SET_SETTINGS_OPEN', false);
    },

    mounted() {
        this.fetchItems();
        this.loadClients();
        this.loadClientBalances();
    },

    methods: {
        async loadClients() {
            try {
                const response = await ClientController.getAllItems();
                this.allClients = response;
            } catch (error) {
                console.error('Ошибка загрузки клиентов:', error);
            }
        },

        async loadClientBalances() {
            this.clientBalancesLoading = true;
            try {
                // Получаем всех клиентов с их балансами
                const clients = await ClientController.getAllItems();
                
                // Для каждого клиента рассчитываем дебет и кредит
                this.clientBalances = clients.map(client => {
                    // Пока используем простую логику - баланс клиента
                    const balance = parseFloat(client.balance) || 0;
                    
                    return {
                        id: client.id,
                        first_name: client.first_name,
                        last_name: client.last_name,
                        currency_symbol: 'TMT', // Можно получить из настроек
                        debt_amount: balance > 0 ? balance : 0, // Нам должны
                        credit_amount: balance < 0 ? Math.abs(balance) : 0, // Мы должны
                    };
                });
            } catch (error) {
                console.error('Ошибка загрузки балансов клиентов:', error);
            } finally {
                this.clientBalancesLoading = false;
            }
        },
        
        itemMapper(i, c) {
            switch (c) {
                case 'debtType':
                    // Используем одно поле для отображения типа операции
                    const isDebt = i.isDebt === 1 || i.isDebt === true || i.isDebt === '1';
                    return isDebt
                        ? '<i class="fas fa-arrow-up text-red-500 mr-2"></i> Продажа (долг)'
                        : '<i class="fas fa-arrow-down text-green-500 mr-2"></i> Оплата клиента';
                case 'clientBalance':
                    // Текущий баланс клиента
                    const balance = parseFloat(i.client?.balance || 0);
                    const formattedBalance = this.$formatNumber(Math.abs(balance), 2, true);
                    const balanceColor = balance >= 0 ? 'text-green-500' : 'text-red-500';
                    const balanceSign = balance >= 0 ? '+' : '';
                    return `<span class="${balanceColor} font-semibold">${balanceSign}${formattedBalance} ${i.cashCurrencySymbol || ''}</span>`;
                case 'clientImpact':
                    // Вычисляемое влияние на баланс
                    const isDebtImpact = i.isDebt === 1 || i.isDebt === true || i.isDebt === '1';
                    const formattedAmount = this.$formatNumber(parseFloat(i.cashAmount), 2, true);
                    const currencySymbol = i.cashCurrencySymbol || '';
                    
                    if (isDebtImpact) {
                        // Долг (is_debt=true): увеличиваем задолженность (+amount) - красный
                        return `<span class="text-red-500 font-semibold">+${formattedAmount} ${currencySymbol}</span>`;
                    } else {
                        // Оплата (is_debt=false): уменьшаем задолженность (-amount) - зелёный
                        return `<span class="text-green-500 font-semibold">-${formattedAmount} ${currencySymbol}</span>`;
                    }
                case 'categoryName':
                    return i.category_name ? i.category_name : '-';
                case 'note':
                    return i.note ? i.note : '-';
                case 'dateUser':
                    return `${i.formatDate()} / ${i.userName}`;
                default:
                    return i[c];
            }
        },

        handlePerPageChange(newPerPage) {
            this.perPage = newPerPage;
            this.fetchItems(1, false);
        },

        async handleCompanyChanged(companyId) {
            this.clientId = '';
            this.dateFilter = 'all_time';
            this.startDate = null;
            this.endDate = null;
            this.selectedIds = [];
            await this.fetchItems(1, false);
        },

        async fetchItems(page = 1, silent = false) {
            if (!silent) {
                this.loading = true;
            }
            try {
                const new_data = await TransactionController.getItems(
                    page,
                    null, // cash_id - не фильтруем по кассе
                    this.dateFilter,
                    null, // order_id
                    null, // search
                    null, // transaction_type - не фильтруем по типу
                    null, // source
                    null, // project_id
                    this.perPage,
                    this.startDate,
                    this.endDate,
                    null // ✅ Убрал is_debt - показываем ВСЕ проводки, влияющие на баланс
                );
                
                // Фильтруем по клиенту если выбран
                if (this.clientId) {
                    new_data.items = new_data.items.filter(item => item.client_id == this.clientId);
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
            this.modalDialog = true;
            this.editingItem = item;
        },

        resetFilters() {
            this.clientId = '';
            this.dateFilter = 'all_time';
            this.startDate = null;
            this.endDate = null;
            this.fetchItems();
        },

        handleSaved() {
            this.$options.mixins.find(m => m.methods?.handleSaved)?.methods.handleSaved.call(this);
        },

        handleDeleted() {
            this.$options.mixins.find(m => m.methods?.handleDeleted)?.methods.handleDeleted.call(this);
        },

        handleCopyTransaction(copiedTransaction) {
            this.closeModal();
            setTimeout(() => {
                this.showModal(copiedTransaction);
            }, 100);
        },
    },

    computed: {
        hasActiveFilters() {
            return this.clientId !== '' ||
                   this.dateFilter !== 'all_time' ||
                   this.startDate !== null ||
                   this.endDate !== null;
        }
    },
}
</script>
