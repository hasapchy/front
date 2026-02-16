<template>
    <div class="mt-4">
        <transition name="fade" mode="out-in">
            <div v-if="!balanceLoading" key="content">
                <DraggableTable table-key="project.balance"
                    :columns-config="columnsConfig" :table-data="balanceHistory || []" :item-mapper="itemMapper"
                    @selectionChange="selectedIds = $event" :onItemClick="handleBalanceItemClick">
                    <template #tableSettingsAdditional>
                        <div v-if="canViewProjectBudget" class="flex flex-wrap items-center gap-3 text-xs text-gray-600 w-full mb-2">
                            <span class="inline-flex items-center gap-1">
                                <i class="fas fa-arrow-up text-[#5CB85C]" :title="$t('income')"></i>
                                <b class="text-[#5CB85C]">{{ totalIncomeDisplay }}</b>
                            </span>
                            <span class="inline-flex items-center gap-1">
                                <i class="fas fa-arrow-down text-[#EE4F47]" :title="$t('outcome')"></i>
                                <b class="text-[#EE4F47]">{{ totalExpenseDisplay }}</b>
                            </span>
                            <span class="inline-flex items-center gap-1">
                                <i class="fas fa-wallet text-blue-500" :title="$t('total') || 'Итого'"></i>
                                <b :class="{
                                    'text-[#5CB85C]': detailedBalance.total_balance >= 0,
                                    'text-[#EE4F47]': detailedBalance.total_balance < 0
                                }">{{ formatBalance(detailedBalance.total_balance) }}</b>
                            </span>
                            <span class="inline-flex items-center gap-1">
                                <i class="fas fa-chart-line text-purple-500" :title="$t('projectBudget')"></i>
                                <b class="text-purple-600">{{ budgetDisplay }}</b>
                            </span>
                        </div>
                    </template>
                    <template #tableSettingsRight>
                        <PrimaryButton
                            v-if="$store.getters.hasPermission('transactions_create')"
                            icon="fas fa-plus"
                            :onclick="() => showAddTransactionModal('income')"
                            :is-small="true">
                            {{ $t('income') }}
                        </PrimaryButton>
                        <PrimaryButton
                            v-if="$store.getters.hasPermission('transactions_create')"
                            icon="fas fa-minus"
                            :isDanger="true"
                            :onclick="() => showAddTransactionModal('outcome')"
                            :is-small="true">
                            {{ $t('outcome') }}
                        </PrimaryButton>
                    </template>
                </DraggableTable>
            </div>
            <div v-else key="loader" class="min-h-64">
                <TableSkeleton />
            </div>
        </transition>

        <!-- Модальное окно для создания/редактирования транзакции -->
        <SideModalDialog 
            :showForm="transactionModalOpen" 
            :onclose="closeTransactionModal">
            <TransactionCreatePage 
                v-if="transactionModalOpen && !transactionLoading"
                :editingItem="editingTransactionItem"
                :initialProjectId="editingItem?.id"
                :form-config="projectFormConfig"
                :client-balances="editingItem?.client?.balances || []"
                :header-text="'Транзакция — проект'"
                @saved="handleTransactionSaved"
                @saved-error="handleTransactionSavedError"
                @deleted="handleTransactionDeleted"
                @deleted-error="handleTransactionSavedError"
                @close-request="closeTransactionModal" />
            <div v-else-if="transactionLoading" class="min-h-64">
                <TableSkeleton />
            </div>
        </SideModalDialog>

    </div>
</template>

<script>
import DraggableTable from "@/views/components/app/forms/DraggableTable.vue";
import SideModalDialog from "@/views/components/app/dialog/SideModalDialog.vue";
import PrimaryButton from "@/views/components/app/buttons/PrimaryButton.vue";
import TableSkeleton from "@/views/components/app/TableSkeleton.vue";
import SourceButtonCell from "@/views/components/app/buttons/SourceButtonCell.vue";
import DebtCell from "@/views/components/app/buttons/DebtCell.vue";
import ProjectAmountCell from "@/views/components/app/buttons/ProjectAmountCell.vue";
import getApiErrorMessage from "@/mixins/getApiErrorMessageMixin";
import notificationMixin from "@/mixins/notificationMixin";
import { defineAsyncComponent, markRaw } from 'vue';
import { translateTransactionCategory } from '@/utils/transactionCategoryUtils';

const TransactionCreatePage = defineAsyncComponent(() => 
    import("@/views/pages/transactions/TransactionCreatePage.vue")
);
import TransactionController from "@/api/TransactionController";
import ProjectController from "@/api/ProjectController";
import { TRANSACTION_FORM_PRESETS } from '@/constants/transactionFormPresets';

export default {
    mixins: [notificationMixin, getApiErrorMessage],
    components: {
        DraggableTable,
        SideModalDialog,
        PrimaryButton,
        TableSkeleton,
        SourceButtonCell,
        TransactionCreatePage,
    },
    props: {
        editingItem: { required: true },
    },
    data() {
        return {
            currencySymbol: '',
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
            selectedNewTransactionType: null,
            columnsConfig: [
                { name: "id", label: "№", size: 60 },
                { name: "dateUser", label: this.$t("dateUser"), size: 120 },
                { 
                    name: "source", 
                    label: this.$t("source"), 
                    size: 150, 
                    component: markRaw(SourceButtonCell),
                    props: (item) => {
                        const sourceId = item.sourceSourceId || item.sourceId;
                        
                        return {
                            source: item.source,
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
                { name: "categoryName", label: this.$t("category"), size: 150 },
                { name: "user_name", label: this.$t("user"), size: 120 },
                {
                    name: "is_debt",
                    label: this.$t("debt"),
                    size: 80,
                    component: markRaw(DebtCell),
                    props: (item) => ({
                        isDebt: item.is_debt
                    })
                },
                {
                    name: "amount",
                    label: this.$t("amount"),
                    size: 130,
                    component: markRaw(ProjectAmountCell),
                    props: (item) => ({
                        item: item,
                        projectCurrency: this.editingItem?.currency?.symbol || this.currencySymbol || 'Нет валюты',
                        formatNumberFn: this.$formatNumber
                    })
                },
            ],
        };
    },
    computed: {
        canViewProjectBudget() {
            return this.$store.getters.hasPermission('settings_project_budget_view');
        },
        hasProjectCurrency() {
            return this.editingItem?.currencyId && this.editingItem?.currency;
        },
        projectFormConfig() {
            const type = this.selectedNewTransactionType || this.editingTransactionItem?.typeName?.();
            return type === 'outcome'
                ? TRANSACTION_FORM_PRESETS.projectBalanceOutcome
                : TRANSACTION_FORM_PRESETS.projectBalanceIncome;
        },
        balanceFormatted() {
            const balance = typeof this.balance === 'number' ? this.balance : 0;
            return this.$formatNumber(balance, null, true);
        },
        budgetFormatted() {
            const budget = parseFloat(this.budget) || 0;
            return this.$formatNumber(budget, null, true);
        },
        budgetDisplay() {
            if (!this.hasProjectCurrency) {
                return `${this.budgetFormatted} ${this.currencySymbol}`;
            }
            return `${this.budgetFormatted} ${this.editingItem?.currency?.symbol}`;
        },
        balanceDisplay() {
            if (!this.hasProjectCurrency) {
                return `${this.balanceFormatted} ${this.currencySymbol}`;
            }
            return `${this.balanceFormatted} ${this.editingItem?.currency?.symbol}`;
        },
        totalIncome() {
            if (!this.balanceHistory?.length) return 0;
            return this.balanceHistory
                .filter(item => parseFloat(item.amount) > 0)
                .reduce((sum, item) => sum + parseFloat(item.amount), 0);
        },
        totalExpense() {
            if (!this.balanceHistory?.length) return 0;
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
            if (!this.hasProjectCurrency) {
                return `${this.totalIncomeFormatted} ${this.currencySymbol}`;
            }
            return `${this.totalIncomeFormatted} ${this.editingItem?.currency?.symbol}`;
        },
        totalExpenseDisplay() {
            if (!this.hasProjectCurrency) {
                return `${this.totalExpenseFormatted} ${this.currencySymbol}`;
            }
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
            if (!this.hasProjectCurrency) {
                return `${formattedBalance} ${this.currencySymbol}`;
            }
            return `${formattedBalance} ${this.editingItem?.currency?.symbol}`;
        },
        async fetchDefaultCurrency() {
            try {
                // Используем данные из store
                await this.$store.dispatch('loadCurrencies');
                const currencies = this.$store.getters.currencies;
                const defaultCurrency = currencies.find(c => c.isDefault);
                this.currencySymbol = defaultCurrency ? defaultCurrency.symbol : 'Нет валюты';
            } catch (error) {
                this.currencySymbol = 'Нет валюты';
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
                const projectCurrency = this.editingItem?.currency?.symbol || this.currencySymbol || 'Нет валюты';
                
                this.balanceHistory = (data.history || [])
                    .filter(item => item.source !== 'project_income'); // Исключаем project_income записи
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
                case "id":
                    return i.sourceId ?? i.id ?? '-';
                case "dateUser":
                    return i.dateUser || (i.formatDate ? i.formatDate() : '');
                case "note":
                    return i.note || '';
                case "categoryName":
                    return translateTransactionCategory(i.categoryName, this.$t) || '-';
                case "user_name":
                    return i.userName || '-';
                case "amount":
                    // Возвращаем числовое значение для сортировки (отображение через компонент ProjectAmountCell)
                    return parseFloat(i.amount || 0);
                default:
                    return i[c];
            }
        },
        async handleBalanceItemClick(item) {
            if (!item?.sourceId) return;
            
            try {
                this.transactionLoading = true;
                this.editingTransactionItem = await TransactionController.getItem(item.sourceId);
                const type = this.editingTransactionItem?.typeName?.() 
                    || (this.editingTransactionItem?.type == 2 ? 'outcome' : 'income');
                this.selectedNewTransactionType = type;
                this.transactionModalOpen = true;
            } catch (error) {
                console.error('Error loading transaction:', error);
                this.$notify?.({ type: 'error', text: 'Ошибка при загрузке транзакции' });
            } finally {
                this.transactionLoading = false;
            }
        },
        showAddTransactionModal(type) {
            this.editingTransactionItem = null;
            this.selectedNewTransactionType = type || 'income';
            this.transactionModalOpen = true;
        },
        closeTransactionModal() {
            this.transactionModalOpen = false;
            this.editingTransactionItem = null;
            this.selectedNewTransactionType = null;
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
        async handleTransactionDeleted() {
            this.transactionModalOpen = false;
            this.editingTransactionItem = null;
            this.forceRefresh = true;
            await this.fetchBalanceHistory();
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