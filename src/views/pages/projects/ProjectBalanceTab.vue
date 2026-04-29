<template>
  <div class="mt-4">
    <transition
      name="fade"
      mode="out-in"
    >
      <div
        v-if="!balanceLoading"
        key="content"
      >
        <div
          v-if="canViewProjectBudget"
          class="flex flex-wrap items-center gap-3 text-xs text-gray-600 w-full mb-4"
        >
          <span class="inline-flex items-center gap-1">
            <i
              class="fas fa-arrow-up text-[#5CB85C]"
              :title="$t('income')"
            />
            <b class="text-[#5CB85C]">{{ totalIncomeDisplay }}</b>
          </span>
          <span class="inline-flex items-center gap-1">
            <i
              class="fas fa-arrow-down text-[#EE4F47]"
              :title="$t('outcome')"
            />
            <b class="text-[#EE4F47]">{{ totalExpenseDisplay }}</b>
          </span>
          <span class="inline-flex items-center gap-1">
            <i
              class="fas fa-wallet text-blue-500"
              :title="$t('total')"
            />
            <b
              :class="{
                'text-[#5CB85C]': detailedBalance.totalBalance >= 0,
                'text-[#EE4F47]': detailedBalance.totalBalance < 0
              }"
            >{{ formatBalance(detailedBalance.totalBalance) }}</b>
          </span>
          <span class="inline-flex items-center gap-1">
            <i
              class="fas fa-chart-line text-purple-500"
              :title="$t('projectBudget')"
            />
            <b class="text-purple-600">{{ budgetDisplay }}</b>
          </span>
        </div>
        <DraggableTable
          table-key="project.balance"
          :columns-config="columnsConfig"
          :table-data="balanceHistory || []"
          :item-mapper="itemMapper"
          :on-item-click="handleBalanceItemClick"
          @selection-change="selectedIds = $event"
        >
          <template #tableControlsBar="{ resetColumns, columns, toggleVisible, log }">
            <TableControlsBar
              :show-pagination="showBalancePagination"
              :pagination-data="showBalancePagination ? balancePaginationData : null"
              :on-page-change="fetchBalanceHistory"
              :on-per-page-change="handleBalancePerPageChange"
              :reset-columns="resetColumns"
              :columns="columns"
              :toggle-visible="toggleVisible"
              :log="log"
            >
              <template #left>
                <PrimaryButton
                  v-if="$store.getters.hasPermission('transactions_create')"
                  icon="fas fa-plus"
                  :onclick="() => showAddTransactionModal('income')"
                  :is-small="true"
                >
                  {{ $t('income') }}
                </PrimaryButton>
                <PrimaryButton
                  v-if="$store.getters.hasPermission('transactions_create')"
                  icon="fas fa-minus"
                  :is-danger="true"
                  :onclick="() => showAddTransactionModal('outcome')"
                  :is-small="true"
                >
                  {{ $t('outcome') }}
                </PrimaryButton>
              </template>
              <template #gear="{ resetColumns, columns, toggleVisible, log }">
                <TableFilterButton
                  v-if="columns && columns.length"
                  :on-reset="resetColumns"
                >
                  <ul>
                    <draggable
                      v-if="columns && columns.length"
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
                          <div><i class="fas fa-grip-vertical text-gray-300 text-sm cursor-grab" /></div>
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
      <div
        v-else
        key="loader"
        class="min-h-64"
      >
        <TableSkeleton />
      </div>
    </transition>

    <!-- Модальное окно для создания/редактирования транзакции -->
    <SideModalDialog 
      :show-form="transactionModalOpen" 
      :title="projectBalanceTxModalTitle"
      :onclose="closeTransactionModal"
      :level="2"
    >
      <TransactionCreatePage 
        v-if="transactionModalOpen && !transactionLoading"
        :editing-item="editingTransactionItem"
        :initial-project-id="editingItem?.id"
        :form-config="projectFormConfig"
        :client-balances="editingItem?.client?.balances || []"
        :header-text="'Транзакция — проект'"
        @saved="handleTransactionSaved"
        @saved-error="handleTransactionSavedError"
        @deleted="handleTransactionDeleted"
        @deleted-error="handleTransactionSavedError"
        @close-request="closeTransactionModal"
      />
      <div
        v-else-if="transactionLoading"
        class="min-h-64"
      >
        <TableSkeleton />
      </div>
    </SideModalDialog>
  </div>
</template>

<script>
import DraggableTable from "@/views/components/app/forms/DraggableTable.vue";
import SideModalDialog, { transactionSideModalTitle } from "@/views/components/app/dialog/SideModalDialog.vue";
import PrimaryButton from "@/views/components/app/buttons/PrimaryButton.vue";
import TableSkeleton from "@/views/components/app/TableSkeleton.vue";
import SourceButtonCell from "@/views/components/app/buttons/SourceButtonCell.vue";
import DebtCell from "@/views/components/app/buttons/DebtCell.vue";
import ProjectAmountCell from "@/views/components/app/buttons/ProjectAmountCell.vue";
import TransactionCreatePage from "@/views/pages/transactions/TransactionCreatePage.vue";
import getApiErrorMessage from "@/mixins/getApiErrorMessageMixin";
import notificationMixin from "@/mixins/notificationMixin";
import { markRaw } from 'vue';
import { translateTransactionCategory } from '@/utils/transactionCategoryUtils';
import TableControlsBar from "@/views/components/app/forms/TableControlsBar.vue";
import TableFilterButton from "@/views/components/app/forms/TableFilterButton.vue";
import { VueDraggableNext } from "vue-draggable-next";

import TransactionController from "@/api/TransactionController";
import ProjectController from "@/api/ProjectController";
import { TRANSACTION_FORM_PRESETS } from '@/constants/transactionFormPresets';

export default {
    components: {
        DraggableTable,
        TableControlsBar,
        TableFilterButton,
        SideModalDialog,
        PrimaryButton,
        TableSkeleton,
        TransactionCreatePage,
        draggable: VueDraggableNext,
    },
    mixins: [notificationMixin, getApiErrorMessage],
    props: {
        editingItem: { required: true },
    },
    data() {
        return {
            currencySymbol: '',
            balanceLoading: false,
            balanceHistory: [],
            balancePaginationMeta: null,
            balancePerPage: 20,
            balanceAbortController: null,
            balance: 0,
            budget: 0,
            detailedBalance: {
                totalBalance: 0,
                realBalance: 0,
                totalIncome: 0,
                totalExpense: 0,
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
                                this.fetchBalanceHistory();
                            },
                            onDeleted: () => {
                                this.fetchBalanceHistory();
                            }
                        };
                    }
                },
                { name: "note", label: this.$t("note"), size: 200 },
                { name: "categoryName", label: this.$t("category"), size: 150 },
                { name: "creator", label: this.$t("user"), size: 120 },
                {
                    name: "isDebt",
                    label: this.$t("debt"),
                    size: 80,
                    component: markRaw(DebtCell),
                    props: (item) => ({
                        isDebt: item.isDebt
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
        projectBalanceTxModalTitle() {
            if (!this.transactionModalOpen) {
                return '';
            }
            if (this.transactionLoading) {
                return this.$t('loading');
            }
            return transactionSideModalTitle(this.$t.bind(this), {
                headerText: 'Транзакция — проект',
                editingItem: this.editingTransactionItem,
            });
        },
        balanceFormatted() {
            const balance = Number(this.balance);
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
            const income = this.detailedBalance?.totalIncome ?? 0;
            return Number(income) || 0;
        },
        totalExpense() {
            const expense = this.detailedBalance?.totalExpense ?? 0;
            return Math.abs(Number(expense) || 0);
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
        showBalancePagination() {
            const meta = this.balancePaginationMeta;
            return meta && (meta.total ?? 0) > 0;
        },
        balancePaginationData() {
            if (!this.showBalancePagination) {
                return null;
            }
            return {
                currentPage: this.balancePaginationMeta.currentPage ?? 1,
                lastPage: this.balancePaginationMeta.lastPage ?? 1,
                perPage: this.balancePaginationMeta.perPage ?? this.balancePerPage,
            };
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
    async mounted() {
        await this.fetchDefaultCurrency();
        try {
            const savedPerPage = localStorage.getItem(this.$storageUi.LS_KEYS.perPage);
            if (savedPerPage) {
                const parsed = parseInt(savedPerPage, 10);
                if (!Number.isNaN(parsed) && parsed >= 20 && parsed <= 50) {
                    this.balancePerPage = parsed;
                }
            }
        } catch {
            void 0;
        }
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
            } catch {
                this.currencySymbol = 'Нет валюты';
            }
        },
        async fetchBalanceHistory(page = 1) {
            if (!this.editingItem) return;

            if (this.balanceAbortController) {
                this.balanceAbortController.abort();
            }
            this.balanceAbortController = new AbortController();
            const signal = this.balanceAbortController.signal;

            this.balanceLoading = true;
            try {
                const data = await ProjectController.getBalanceHistory(
                    this.editingItem.id,
                    null,
                    page,
                    this.balancePerPage,
                    signal
                );

                await this.$store.dispatch('loadCurrencies');

                this.balanceHistory = (data.history || []).filter(item => item.source !== 'project_income');
                this.balance = data.balance;
                this.budget = data.budget;
                if (data.currentPage != null) {
                    this.balancePaginationMeta = {
                        currentPage: data.currentPage,
                        lastPage: data.lastPage,
                        total: data.total,
                        perPage: data.perPage || this.balancePerPage,
                    };
                    if (data.perPage) {
                        this.balancePerPage = data.perPage;
                    }
                } else {
                    this.balancePaginationMeta = null;
                }

                try {
                    const detailedData = await ProjectController.getDetailedBalance(this.editingItem.id);
                    this.detailedBalance = detailedData;
                } catch {
                    this.detailedBalance = {
                        totalBalance: 0,
                        realBalance: 0,
                        totalIncome: 0,
                        totalExpense: 0,
                    };
                }

            } catch (e) {
                if (e && e.code === 'ERR_CANCELED') {
                    return;
                }
                this.balanceHistory = [];
                this.balance = 0;
                this.budget = 0;
                this.balancePaginationMeta = null;
                this.detailedBalance = {
                    totalBalance: 0,
                    realBalance: 0,
                    totalIncome: 0,
                    totalExpense: 0,
                };
            }
            this.balanceLoading = false;
            this.balanceAbortController = null;
        },
        handleBalancePerPageChange(perPage) {
            this.balancePerPage = perPage;
            this.fetchBalanceHistory(1);
        },
        itemMapper(i, c) {
            switch (c) {
                case "id":
                    return i.sourceId ?? i.id ?? '-';
                case "dateUser":
                    return i.dateUser || (i.formatDate ? i.formatDate() : '');
                case "note":
                    return i.note ;
                case "categoryName":
                    return translateTransactionCategory(i.categoryName, this.$t) || '-';
                case "creator":
                    return i.creator?.name ;
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
            let errorMessage = this.getApiErrorMessage(error);
            if (Array.isArray(errorMessage)) {
                errorMessage = errorMessage.join(', ');
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
};
</script>