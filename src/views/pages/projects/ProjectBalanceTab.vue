<template>
    <div class="mt-4">
        <div class="flex justify-between items-center mb-2">
            <h3 class="text-md font-semibold">{{ $t('balanceHistory') }}</h3>
            <PrimaryButton 
                v-if="$store.getters.hasPermission('transactions_create')"
                icon="fas fa-plus" 
                :onclick="showAddTransactionModal" 
                :is-small="true">
                {{ $t('addTransaction') }}
            </PrimaryButton>
        </div>
        <div v-if="$store.getters.hasPermission('settings_project_budget_view')" class="mb-4">
            <!-- Все показатели в один ряд -->
            <div class="flex items-center gap-6">
                <!-- Приход -->
                <span class="flex items-center gap-2">
                    <i class="fas fa-arrow-up text-[#5CB85C]"></i>
                    <b class="text-[#5CB85C]">{{ totalIncomeDisplay }}</b>
                </span>
                
                <!-- Расход -->
                <span class="flex items-center gap-2">
                    <i class="fas fa-arrow-down text-[#EE4F47]"></i>
                    <b class="text-[#EE4F47]">{{ totalExpenseDisplay }}</b>
                </span>
                
                <!-- Итого -->
                <span class="flex items-center gap-2">
                    <i class="fas fa-wallet text-blue-500"></i>
                    <b :class="{
                        'text-[#5CB85C]': detailedBalance.total_balance >= 0,
                        'text-[#EE4F47]': detailedBalance.total_balance < 0
                    }">{{ formatBalance(detailedBalance.total_balance) }}</b>
                </span>
                
                <!-- Бюджет -->
                <span class="flex items-center gap-2">
                    <i class="fas fa-chart-line text-purple-500"></i>
                    <b class="text-purple-600">{{ budgetDisplay }}</b>
                </span>
            </div>
        </div>
        <div v-if="balanceLoading" class="text-gray-500">{{ $t('loading') }}</div>
        <div v-else-if="balanceHistory.length === 0" class="text-gray-500">
            {{ $t('noHistory') }}
        </div>
        <DraggableTable v-if="!balanceLoading && balanceHistory.length" table-key="project.balance"
            :columns-config="columnsConfig" :table-data="balanceHistory" :item-mapper="itemMapper"
            @selectionChange="selectedIds = $event" :onItemClick="handleBalanceItemClick" />

        <!-- Модальное окно для создания/редактирования транзакции -->
        <SideModalDialog 
            :showForm="transactionModalOpen" 
            :onclose="closeTransactionModal">
            <TransactionCreatePage 
                v-if="!transactionLoading"
                :editingItem="editingTransactionItem"
                :initialProjectId="editingItem?.id"
                :initialClient="editingItem?.client"
                @saved="handleTransactionSaved"
                @saved-error="handleTransactionSavedError"
                @close-request="closeTransactionModal" />
            
            <div v-else-if="transactionLoading" class="p-4 text-center">
                {{ $t('loading') }}...
            </div>
        </SideModalDialog>

        <!-- Notification Toast -->
        <NotificationToast 
            :title="notificationTitle" 
            :subtitle="notificationSubtitle" 
            :show="notification" 
            :is-danger="notificationIsDanger" 
            @close="closeNotification" 
        />
    </div>
</template>

<script>
import DraggableTable from "@/views/components/app/forms/DraggableTable.vue";
import SideModalDialog from "@/views/components/app/dialog/SideModalDialog.vue";
import PrimaryButton from "@/views/components/app/buttons/PrimaryButton.vue";
import NotificationToast from "@/views/components/app/dialog/NotificationToast.vue";
import SourceButtonCell from "@/views/components/app/buttons/SourceButtonCell.vue";
import getApiErrorMessage from "@/mixins/getApiErrorMessageMixin";
import notificationMixin from "@/mixins/notificationMixin";
import { defineAsyncComponent, markRaw } from 'vue';

const TransactionCreatePage = defineAsyncComponent(() => 
    import("@/views/pages/transactions/TransactionCreatePage.vue")
);
import TransactionController from "@/api/TransactionController";
import ProjectController from "@/api/ProjectController";

export default {
    mixins: [notificationMixin, getApiErrorMessage],
    components: {
        DraggableTable,
        SideModalDialog,
        PrimaryButton,
        NotificationToast,
        SourceButtonCell,
        TransactionCreatePage,
    },
    props: {
        editingItem: { required: true },
    },
    data() {
        return {
            currencyCode: '',
            balanceLoading: false,
            balanceHistory: [],
            lastFetchedProjectId: null, // Для предотвращения дублирования запросов
            forceRefresh: false,
            balance: 0,
            budget: 0,
            detailedBalance: {
                total_balance: 0,
                real_balance: 0
            },
            transactionModalOpen: false,
            editingTransactionItem: null,
            transactionLoading: false,
            columnsConfig: [
                { name: "dateUser", label: this.$t("date"), size: 120 },
                { 
                    name: "source", 
                    label: this.$t("source"), 
                    size: 150, 
                    component: markRaw(SourceButtonCell),
                    props: (item) => {
                        const isTransaction = item.sourceType && item.sourceType.includes('Transaction');
                        const sourceId = isTransaction ? item.sourceId : (item.sourceSourceId || item.sourceId);
                        
                        return {
                            sourceType: item.sourceType,
                            sourceId: sourceId,
                            onUpdated: () => {
                                this.forceRefresh = true;
                                this.fetchBalanceHistory();
                            },
                            onDeleted: () => {
                                this.forceRefresh = true;
                                this.fetchBalanceHistory();
                            }
                        };
                    }
                },
                { name: "note", label: this.$t("note"), size: 200 },
                { name: "user_name", label: this.$t("user"), size: 120 },
                { name: "is_debt", label: this.$t("debt"), size: 80, html: true },
                { name: "amount", label: this.$t("amount"), size: 130, html: true },
            ],
            ENTITY_CONFIG: {
                transaction: {
                    fetch: id => TransactionController.getItem(id),
                    component: markRaw(TransactionCreatePage),
                    prop: 'editingItem',
                },
            },
        };
    },
    computed: {
        balanceFormatted() {
            const balance = typeof this.balance === 'number' ? this.balance : 0;
            return this.$formatNumber(balance, null, true);
        },
        budgetFormatted() {
            const budget = parseFloat(this.budget) || 0;
            return this.$formatNumber(budget, null, true);
        },
        budgetDisplay() {
            if (!this.editingItem || !this.editingItem.currencyId || !this.editingItem.currency) {
                return `${this.budgetFormatted} ${this.currencyCode}`;
            }
            
            // Бюджет уже в валюте проекта, показываем его
            return `${this.budgetFormatted} ${this.editingItem?.currency?.symbol}`;
        },
        balanceDisplay() {
            if (!this.editingItem || !this.editingItem.currencyId || !this.editingItem.currency) {
                return `${this.balanceFormatted} ${this.currencyCode}`;
            }
            
            // Баланс уже в валюте проекта (конвертация происходит на бэкенде)
            return `${this.balanceFormatted} ${this.editingItem?.currency?.symbol}`;
        },
        totalIncome() {
            if (!this.balanceHistory || this.balanceHistory.length === 0) return 0;
            return this.balanceHistory
                .filter(item => parseFloat(item.amount) > 0)
                .reduce((sum, item) => sum + parseFloat(item.amount), 0);
        },
        totalExpense() {
            if (!this.balanceHistory || this.balanceHistory.length === 0) return 0;
            return Math.abs(this.balanceHistory
                .filter(item => parseFloat(item.amount) < 0)
                .reduce((sum, item) => sum + parseFloat(item.amount), 0));
        },
        totalIncomeFormatted() {
            return this.$formatNumber(this.totalIncome, null, true);
        },
        totalExpenseFormatted() {
            return this.$formatNumber(this.totalExpense, null, true);
        },
        totalIncomeDisplay() {
            if (!this.editingItem || !this.editingItem.currencyId || !this.editingItem.currency) {
                return `${this.totalIncomeFormatted} ${this.currencyCode}`;
            }
            
            // Приход уже в валюте проекта (конвертация происходит на бэкенде)
            return `${this.totalIncomeFormatted} ${this.editingItem?.currency?.symbol}`;
        },
        totalExpenseDisplay() {
            if (!this.editingItem || !this.editingItem.currencyId || !this.editingItem.currency) {
                return `${this.totalExpenseFormatted} ${this.currencyCode}`;
            }
            
            // Расход уже в валюте проекта (конвертация происходит на бэкенде)
            return `${this.totalExpenseFormatted} ${this.editingItem?.currency?.symbol}`;
        },
    },
    async mounted() {
        await this.fetchDefaultCurrency();
        // fetchBalanceHistory вызывается через watch
    },
    methods: {
        formatBalance(balance) {
            const formattedBalance = this.$formatNumber(balance || 0, null, true);
            if (!this.editingItem || !this.editingItem.currencyId || !this.editingItem.currency) {
                return `${formattedBalance} ${this.currencyCode}`;
            }
            return `${formattedBalance} ${this.editingItem?.currency?.symbol}`;
        },
        async fetchDefaultCurrency() {
            try {
                // Используем данные из store
                await this.$store.dispatch('loadCurrencies');
                const currencies = this.$store.getters.currencies;
                const defaultCurrency = currencies.find(c => c.isDefault);
                this.currencyCode = defaultCurrency ? defaultCurrency.symbol : 'Нет валюты';
            } catch (error) {
                this.currencyCode = 'Нет валюты';
            }
        },
        async fetchBalanceHistory() {
            if (!this.editingItem) return;
            
            // Предотвращаем повторные запросы для того же проекта
            if (this.lastFetchedProjectId === this.editingItem.id && !this.forceRefresh) {
                return;
            }
            
            this.balanceLoading = true;
            try {
                // DRY: ProjectController.getBalanceHistory() уже возвращает DTO
                const data = await ProjectController.getBalanceHistory(this.editingItem.id);
                
                // Получаем информацию о валютах из store
                await this.$store.dispatch('loadCurrencies');
                
                // Определяем валюту проекта
                const projectCurrency = this.editingItem?.currency?.symbol || this.currencyCode || 'Нет валюты';
                
                // DRY: используем методы DTO для форматирования
                this.balanceHistory = (data.history || [])
                    .filter(item => item.source !== 'project_income') // Исключаем project_income записи
                    .map(item => {
                        // Привязываем метод форматирования с валютой проекта
                        const originalFormatAmount = item.formatAmountWithColor.bind(item);
                        item.formatAmountWithColor = () => originalFormatAmount(projectCurrency, this.$formatNumber);
                        return item;
                    });
                this.balance = data.balance;
                this.budget = data.budget;
                
                // Загружаем детальный баланс
                try {
                    const detailedData = await ProjectController.getDetailedBalance(this.editingItem.id);
                    this.detailedBalance = detailedData;
                } catch (error) {
                    console.error('Ошибка при получении детального баланса:', error);
                    this.detailedBalance = {
                        total_balance: 0,
                        real_balance: 0
                    };
                }
                
                // Сохраняем ID загруженного проекта
                this.lastFetchedProjectId = this.editingItem.id;
                this.forceRefresh = false;
            } catch (e) {
                this.balanceHistory = [];
                this.balance = 0;
                this.budget = 0;
                this.detailedBalance = {
                    total_balance: 0,
                    real_balance: 0
                };
            }
            this.balanceLoading = false;
        },
        itemMapper(i, c) {
            switch (c) {
                case "dateUser":
                    return i.dateUser || (i.formatDate ? i.formatDate() : '');
                // case "source" - больше не нужен, используется компонент SourceButtonCel
                case "note":
                    return i.note || '';
                case "user_name":
                    return i.userName || '-';
                case "is_debt":
                    return i.getDebtHtml ? i.getDebtHtml() : '-';
                case "amount":
                    return i.formatAmountWithColor ? i.formatAmountWithColor() : '-';
                default:
                    return i[c];
            }
        },
        async handleBalanceItemClick(item) {
            try {
                this.transactionLoading = true;
                const sourceId = item?.sourceSourceId || item?.sourceId;
                if (!sourceId) {
                    this.$notify?.({ type: 'error', text: 'Ошибка при загрузке транзакции' });
                    return;
                }
                const data = await this.ENTITY_CONFIG.transaction.fetch(sourceId);
                this.editingTransactionItem = data;
                
                
                this.transactionModalOpen = true;
            } catch (error) {
                console.error('Error loading transaction:', error);
                this.$notify?.({ type: 'error', text: 'Ошибка при загрузке транзакции: ' + (error.message || error) });
            } finally {
                this.transactionLoading = false;
            }
        },
        showAddTransactionModal() {
            this.editingTransactionItem = null;
            this.transactionModalOpen = true;
        },
        closeTransactionModal() {
            this.transactionModalOpen = false;
            this.editingTransactionItem = null;
        },
        async handleTransactionSaved() {
            this.closeTransactionModal();
            // Принудительное обновление
            this.forceRefresh = true;
            await this.fetchBalanceHistory();
        },
        handleTransactionSavedError(error) {
            // Обрабатываем как строку (если передана напрямую), так и объект ошибки API
            let errorMessage;
            if (typeof error === 'string') {
                errorMessage = error;
            } else {
                errorMessage = this.getApiErrorMessage(error);
                if (Array.isArray(errorMessage)) {
                    errorMessage = errorMessage.join(', ');
                }
            }
            this.showNotification(this.$t('error'), errorMessage, true);
        },
    },
    watch: {
        'editingItem.id': {
            handler(newId) {
                if (newId) {
                    this.fetchBalanceHistory();
                } else {
                    this.balanceHistory = [];
                    this.lastFetchedProjectId = null;
                }
            },
            immediate: true,
        },
    },
};
</script>