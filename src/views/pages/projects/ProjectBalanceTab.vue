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

    </div>
</template>

<script>
import DraggableTable from "@/views/components/app/forms/DraggableTable.vue";
import SideModalDialog from "@/views/components/app/dialog/SideModalDialog.vue";
import PrimaryButton from "@/views/components/app/buttons/PrimaryButton.vue";
import { defineAsyncComponent, markRaw } from 'vue';

const TransactionCreatePage = defineAsyncComponent(() => 
    import("@/views/pages/transactions/TransactionCreatePage.vue")
);
import TransactionController from "@/api/TransactionController";
import ProjectController from "@/api/ProjectController";
import ClientDto from "@/dto/client/ClientDto";
import TransactionDto from "@/dto/transaction/TransactionDto";

export default {
    components: {
        DraggableTable,
        SideModalDialog,
        PrimaryButton,
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
                { name: "note", label: this.$t("note"), size: 200 },
                { name: "user_name", label: this.$t("user"), size: 120 },
                { name: "is_debt", label: this.$t("debt"), size: 80, html: true },
                { name: "amount", label: this.$t("amount"), size: 130, html: true },
            ],
            ENTITY_CONFIG: {
                transaction: {
                    fetch: id => TransactionController.getItem(id).then(r => {
                        let client = null;
                        if (r.item.client) {
                            client = ClientDto.fromApi(r.item.client);
                        }
                        return new TransactionDto(
                            r.item.id,
                            r.item.type,
                            r.item.is_transfer,
                            r.item.is_sale || 0,
                            r.item.is_receipt || 0,
                            r.item.is_debt || 0,
                            r.item.cash_id,
                            r.item.cash_name,
                            r.item.cash_amount,
                            r.item.cash_currency_id,
                            r.item.cash_currency_name,
                            r.item.cash_currency_code,
                            r.item.cash_currency_symbol,
                            r.item.orig_amount,
                            r.item.orig_currency_id,
                            r.item.orig_currency_name,
                            r.item.orig_currency_code,
                            r.item.orig_currency_symbol,
                            r.item.user_id,
                            r.item.user_name,
                            r.item.category_id,
                            r.item.category_name,
                            r.item.category_type,
                            r.item.project_id,
                            r.item.project_name,
                            r.item.client_id,
                            client,
                            r.item.note,
                            r.item.date,
                            r.item.created_at,
                            r.item.updated_at,
                            r.item.orders || []
                        );
                    }),
                    component: markRaw(TransactionCreatePage),
                    prop: 'editingItem',
                },
            },
        };
    },
    computed: {
        balanceFormatted() {
            const balance = typeof this.balance === 'number' ? this.balance : 0;
            return balance.toFixed(2);
        },
        budgetFormatted() {
            const budget = parseFloat(this.budget) || 0;
            return budget.toFixed(2);
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
            return this.totalIncome.toFixed(2);
        },
        totalExpenseFormatted() {
            return this.totalExpense.toFixed(2);
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
        this.fetchBalanceHistory();
    },
    methods: {
        formatBalance(balance) {
            const formattedBalance = (balance || 0).toFixed(2);
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
                const defaultCurrency = currencies.find(c => c.is_default);
                this.currencyCode = defaultCurrency ? defaultCurrency.symbol : 'Нет валюты';
            } catch (error) {
                this.currencyCode = 'Нет валюты';
            }
        },
        async fetchBalanceHistory() {
            if (!this.editingItem) return;
            this.balanceLoading = true;
            try {
                // Добавляем timestamp для принудительного обновления кэша
                const data = await ProjectController.getBalanceHistory(this.editingItem.id, Date.now());
                const self = this; // Сохраняем ссылку на компонент
                
                // Получаем информацию о валютах
                // Используем данные из store
                await this.$store.dispatch('loadCurrencies');
                const currencies = this.$store.getters.currencies;
                const currencyMap = {};
                currencies.forEach(currency => {
                    currencyMap[currency.id] = currency;
                });
                
                this.balanceHistory = (data.history || [])
                    .filter(item => item.source !== 'project_income') // Исключаем project_income записи
                    .map(
                    (item) => ({
                        ...item,
                        get dateUser() {
                            return item.date ? new Date(item.date).toLocaleString() : "";
                        },
                        formatDate() {
                            return item.date ? new Date(item.date).toLocaleString() : "";
                        },
                        formatAmountWithColor() {
                            const val = parseFloat(item.amount);
                            const color = val >= 0 ? "#5CB85C" : "#EE4F47";
                            
                            // Определяем валюту проекта
                            let projectCurrency = self.currencyCode || 'Нет валюты';
                            if (self.editingItem && self.editingItem.currency && self.editingItem.currency.symbol) {
                                projectCurrency = self.editingItem.currency.symbol;
                            }
                            
                            // Сумма уже конвертирована в валюту проекта на бэкенде
                            // Если есть информация о валюте кассы и исходной сумме, показываем исходную сумму в скобках
                            if (item.cash_currency_symbol && item.orig_amount) {
                                const originalAmount = parseFloat(item.orig_amount);
                                const originalSymbol = item.cash_currency_symbol;
                                
                                // Если валюта кассы отличается от валюты проекта, показываем исходную сумму в скобках
                                if (originalSymbol !== projectCurrency) {
                                    return `<span style="color:${color};font-weight:bold">${val.toFixed(2)} ${projectCurrency} (${originalAmount.toFixed(2)} ${originalSymbol})</span>`;
                                }
                            }
                            
                            // Для всех случаев показываем сумму в валюте проекта
                            return `<span style="color:${color};font-weight:bold">${val.toFixed(2)} ${projectCurrency}</span>`;
                        },
                        label() {
                            switch (item.source) {
                                case "transaction": 
                                    return '<i class="fas fa-circle text-[#6C757D] mr-2"></i> Прочее';
                                case "sale": 
                                    return '<i class="fas fa-shopping-cart text-[#5CB85C] mr-2"></i> Продажа';
                                case "order": 
                                    return '<i class="fas fa-file-invoice text-[#337AB7] mr-2"></i> Заказ';
                                case "receipt": 
                                    return '<i class="fas fa-box text-[#FFA500] mr-2"></i> Оприходование';
                                default: 
                                    return item.source;
                            }
                        }
                    })
                );
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
                    return i.dateUser;
                case "note":
                    return i.note || '-';
                case "user_name":
                    return i.user_name;
                case "is_debt":
                    if (i.is_debt === 1 || i.is_debt === true || i.is_debt === '1') {
                        return '<i class="fas fa-check text-green-500"></i>';
                    } else {
                        return '<i class="fas fa-times text-red-500"></i>';
                    }
                case "amount":
                    return i.formatAmountWithColor?.();
                default:
                    return i[c];
            }
        },
        async handleBalanceItemClick(item) {
            // Всегда открываем транзакцию, поскольку именно в ней содержится финансовая информация
            try {
                this.transactionLoading = true;
                // Для всех типов источников source_id содержит ID транзакции
                const data = await this.ENTITY_CONFIG.transaction.fetch(item.source_id);
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
        handleTransactionSaved() {
            this.closeTransactionModal();
            // Небольшая задержка для обновления кэша на backend
            setTimeout(() => {
                this.fetchBalanceHistory();
            }, 100);
        },
        handleTransactionSavedError(error) {
            console.error('Ошибка сохранения транзакции:', error);
        },
    },
    watch: {
        editingItem: {
            handler() {
                this.fetchBalanceHistory();
            },
            immediate: true,
        },
    },
};
</script>