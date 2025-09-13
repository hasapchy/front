<template>
    <div class="mt-4">
        <div class="flex justify-between items-center mb-2">
            <h3 class="text-md font-semibold">{{ $t('balanceHistory') }}</h3>
            <!-- <PrimaryButton 
                v-if="$store.getters.hasPermission('transactions_create')"
                icon="fas fa-plus" 
                :onclick="showAddIncomeModal" 
                :is-small="true">
                {{ $t('addIncome') }}
            </PrimaryButton> -->
        </div>
        <div v-if="$store.getters.hasPermission('settings_project_budget_view')" class="mb-2 flex items-center gap-2">
            <span>{{ $t('finalBalance') }}:</span>
            <span :class="{
                'text-[#5CB85C] font-bold': balance >= 0,
                'text-[#EE4F47] font-bold': balance < 0
            }">
                {{ balanceDisplay }}
            </span>
            <span class="ml-4">{{ $t('totalIncome') }}: <b class="text-[#5CB85C]">{{ totalIncomeDisplay }}</b></span>
            <span class="ml-4">{{ $t('totalExpense') }}: <b class="text-[#EE4F47]">{{ totalExpenseDisplay }}</b></span>
            <span class="ml-4">{{ $t('budget') }}: <b>{{ budgetDisplay }}</b></span>
        </div>
        <div v-if="balanceLoading" class="text-gray-500">{{ $t('loading') }}</div>
        <div v-else-if="balanceHistory.length === 0" class="text-gray-500">
            {{ $t('noHistory') }}
        </div>
        <DraggableTable v-if="!balanceLoading && balanceHistory.length" table-key="project.balance"
            :columns-config="columnsConfig" :table-data="balanceHistory" :item-mapper="itemMapper"
            @selectionChange="selectedIds = $event" :onItemClick="handleBalanceItemClick" />

        <!-- Модальное окно для создания/редактирования прихода -->
        <!-- <SideModalDialog 
            :showForm="false" 
            :onclose="() => {}">
            <div>ProjectTransactionCreatePage</div>
        </SideModalDialog> -->

        <!-- Модальное окно для других сущностей -->
        <SideModalDialog 
            :showForm="entityModalOpen" 
            :onclose="closeEntityModal">
            <component 
                v-if="selectedEntity && !entityLoading"
                :is="getModalComponent(selectedEntity.type)"
                v-bind="getModalProps(selectedEntity)"
                @saved="handleEntitySaved"
                @saved-error="handleEntitySavedError"
                @deleted="handleEntityDeleted"
                @deleted-error="handleEntityDeletedError"
                @close-request="closeEntityModal" />
            <div v-else-if="entityLoading" class="p-4 text-center">
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
const SaleCreatePage = defineAsyncComponent(() => 
    import("@/views/pages/sales/SaleCreatePage.vue")
);
const OrderCreatePage = defineAsyncComponent(() => 
    import("@/views/pages/orders/OrderCreatePage.vue")
);
const WarehousesReceiptCreatePage = defineAsyncComponent(() => 
    import("@/views/pages/warehouses/WarehousesReceiptCreatePage.vue")
);

import TransactionController from "@/api/TransactionController";
import SaleController from "@/api/SaleController";
import OrderController from "@/api/OrderController";
import ProjectController from "@/api/ProjectController";
import AppController from "@/api/AppController";

import api from "@/api/axiosInstance";
import SaleDto from "@/dto/sale/SaleDto";
import OrderDto from "@/dto/order/OrderDto";
import ClientDto from "@/dto/client/ClientDto";
import TransactionDto from "@/dto/transaction/TransactionDto";

export default {
    components: {
        DraggableTable,
        SideModalDialog,
        PrimaryButton,
        TransactionCreatePage,
        SaleCreatePage,
        OrderCreatePage,
        WarehousesReceiptCreatePage,
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
            // projectIncome: 0,
            selectedEntity: null,
            entityModalOpen: false,
            entityLoading: false,
            // incomeModalOpen: false,
            // editingIncomeItem: null,
            columnsConfig: [
                { name: "date", label: this.$t("date"), size: 100 },
                { name: "source", label: this.$t("type") },
                { name: "description", label: this.$t("description"), size: 600 },
                { name: "amount", label: this.$t("amount"), size: 120, html: true },
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
                            // r.item.category_id,
                            // r.item.category_name,
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
                sale: {
                    fetch: id => SaleController.getItem(id).then(r => {
                        let client = null;
                        if (r.item.client) {
                            client = ClientDto.fromApi(r.item.client);
                        }
                        return new SaleDto(
                            r.item.id,
                            r.item.price,
                            r.item.discount,
                            r.item.total_price,
                            r.item.currency_id,
                            r.item.currency_name,
                            r.item.currency_code,
                            r.item.currency_symbol,
                            r.item.cash_id,
                            r.item.cash_name,
                            r.item.warehouse_id,
                            r.item.warehouse_name,
                            r.item.user_id,
                            r.item.user_name,
                            r.item.project_id,
                            r.item.project_name,
                            r.item.transaction_id,
                            client,
                            r.item.products,
                            r.item.note,
                            r.item.date,
                            r.item.created_at,
                            r.item.updated_at
                        );
                    }),
                    component: markRaw(SaleCreatePage),
                    prop: 'editingItem',
                },
                order: {
                    fetch: id => OrderController.getItem(id).then(r => {
                        let client = null;
                        if (r.item.client) {
                            client = ClientDto.fromApi(r.item.client);
                        }
                        return new OrderDto(
                            r.item.id,
                            r.item.price,
                            r.item.discount ?? 0,
                            r.item.total_price,
                            r.item.currency_id,
                            r.item.currency_name,
                            r.item.currency_code,
                            r.item.currency_symbol,
                            r.item.cash_id ?? null,
                            r.item.cash_name ?? null,
                            r.item.warehouse_id,
                            r.item.warehouse_name,
                            r.item.user_id,
                            r.item.user_name,
                            r.item.project_id,
                            r.item.project_name,
                            r.item.status_id,
                            r.item.status_name,
                            // r.item.category_id,
                            // r.item.category_name,
                            client,
                            r.item.products,
                            r.item.note ?? "",
                            r.item.description ?? "",
                            r.item.date,
                            r.item.created_at,
                            r.item.updated_at
                        );
                    }),
                    component: markRaw(OrderCreatePage),
                    prop: 'editingItem',
                },
                receipt: {
                    fetch: async id => {
                        const { data } = await api.get(`/warehouse_receipts/${id}`);
                        return data.item ?? data;
                    },
                    component: markRaw(WarehousesReceiptCreatePage),
                    prop: 'editingItem',
                },
                // project_income: {
                //     fetch: id => ProjectTransactionController.getItem(id).then(r => {
                //         return ProjectTransactionDto.fromApi(r.item);
                //     }),
                //     component: ProjectTransactionCreatePage,
                //     prop: 'editingItem',
                // },
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
            return `${this.budgetFormatted} ${this.editingItem.currency.symbol}`;
        },
        balanceDisplay() {
            if (!this.editingItem || !this.editingItem.currencyId || !this.editingItem.currency) {
                return `${this.balanceFormatted} ${this.currencyCode}`;
            }
            
            // Конвертируем баланс в валюту проекта
            const exchangeRate = this.editingItem.exchangeRate || 1;
            const balanceInProjectCurrency = (this.balance / exchangeRate).toFixed(2);
            const originalBalance = this.balance.toFixed(2);
            
            return `${balanceInProjectCurrency} ${this.editingItem.currency.symbol} (${originalBalance} ${this.currencyCode})`;
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
            
            // Конвертируем приход в валюту проекта
            const exchangeRate = this.editingItem.exchangeRate || 1;
            const incomeInProjectCurrency = (this.totalIncome / exchangeRate).toFixed(2);
            const originalIncome = this.totalIncome.toFixed(2);
            
            return `${incomeInProjectCurrency} ${this.editingItem.currency.symbol} (${originalIncome} ${this.currencyCode})`;
        },
        totalExpenseDisplay() {
            if (!this.editingItem || !this.editingItem.currencyId || !this.editingItem.currency) {
                return `${this.totalExpenseFormatted} ${this.currencyCode}`;
            }
            
            // Конвертируем расход в валюту проекта
            const exchangeRate = this.editingItem.exchangeRate || 1;
            const expenseInProjectCurrency = (this.totalExpense / exchangeRate).toFixed(2);
            const originalExpense = this.totalExpense.toFixed(2);
            
            return `${expenseInProjectCurrency} ${this.editingItem.currency.symbol} (${originalExpense} ${this.currencyCode})`;
        },
    },
    async mounted() {
        await this.fetchDefaultCurrency();
        this.fetchBalanceHistory();
    },
    methods: {
        async fetchDefaultCurrency() {
            try {
                const currencies = await AppController.getCurrencies();
                const defaultCurrency = currencies.find(c => c.is_default);
                this.currencyCode = defaultCurrency ? defaultCurrency.symbol : 'Нет валюты';
            } catch (error) {
                console.error('Ошибка при получении дефолтной валюты:', error);
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
                const currencies = await AppController.getCurrencies();
                const currencyMap = {};
                currencies.forEach(currency => {
                    currencyMap[currency.id] = currency;
                });
                
                this.balanceHistory = (data.history || [])
                    .filter(item => item.source !== 'project_income') // Исключаем project_income записи
                    .map(
                    (item) => ({
                        ...item,
                        formatDate() {
                            return item.date ? new Date(item.date).toLocaleString() : "";
                        },
                        formatAmountWithColor() {
                            const val = parseFloat(item.amount);
                            const color = val >= 0 ? "#5CB85C" : "#EE4F47";
                            
                            let currency = self.currencyCode || 'Нет валюты';
                            
                            // Для project_income используем валюту прихода
                            // if (item.source === 'project_income' && item.currency_id && currencyMap[item.currency_id]) {
                            //     currency = currencyMap[item.currency_id].symbol || currencyMap[item.currency_id].code;
                            // }
                            // Для остальных записей оставляем в манатах (как есть)
                            
                            return `<span style="color:${color};font-weight:bold">${val.toFixed(2)} ${currency}</span>`;
                        },
                        label() {
                            switch (item.source) {
                                case "transaction": return self.$t('transaction');
                                case "sale": return self.$t('sale');
                                case "order": return self.$t('order');
                                case "receipt": return self.$t('receipt');
                                // case "project_income": return self.$t('projectIncome');
                                default: return item.source;
                            }
                        }
                    })
                );
                this.balance = data.balance;
                this.budget = data.budget;
                // this.projectIncome = data.projectIncome || 0;
                console.log('Budget loaded:', data.budget, 'Balance loaded:', data.balance);
            } catch (e) {
                console.error(this.$t("errorLoadingBalanceHistory"), e);
                this.balanceHistory = [];
                this.balance = 0;
                this.budget = 0;
                // this.projectIncome = 0;
            }
            this.balanceLoading = false;
        },
        itemMapper(i, c) {
            switch (c) {
                case "date":
                    return i.formatDate();
                case "source":
                    return i.label?.() ?? i.source;
                case "user":
                    return i.user_name;
                case "description":
                    return i.description;
                case "amount":
                    return i.formatAmountWithColor?.();
                default:
                    return i[c];
            }
        },
        async handleBalanceItemClick(item) {
            // Если это приход, открываем модальное окно прихода
            // if (item.source === 'project_income') {
            //     try {
            //         this.editingIncomeItem = await ProjectTransactionController.getItem(item.source_id).then(r => {
            //             return ProjectTransactionDto.fromApi(r.item);
            //         });
            //         this.incomeModalOpen = true;
            //     } catch (error) {
            //         console.error('Error loading project transaction:', error);
            //         this.$notify?.({ type: 'error', text: 'Ошибка при загрузке прихода: ' + (error.message || error) });
            //     }
            //     return;
            // }

            const config = this.ENTITY_CONFIG[item.source];
            if (!config) return;
            this.entityModalOpen = true;
            this.entityLoading = true;
            try {
                const data = await config.fetch(item.source_id);
                this.selectedEntity = {
                    type: item.source,
                    data,
                };
            } catch (e) {
                this.$notify?.({ type: 'error', text: 'Ошибка при загрузке данных: ' + (e.message || e) });
                this.entityModalOpen = false;
                this.selectedEntity = null;
            } finally {
                this.entityLoading = false;
            }
        },
        getModalProps(entity) {
            const config = this.ENTITY_CONFIG[entity.type];
            return config ? { [config.prop]: entity.data } : {};
        },
        getModalComponent(type) {
            const component = this.ENTITY_CONFIG[type]?.component;
            return component || null;
        },
        closeEntityModal() {
            this.entityModalOpen = false;
            this.selectedEntity = null;
        },
        // showAddIncomeModal() {
        //     this.editingIncomeItem = null;
        //     this.incomeModalOpen = true;
        // },
        // closeIncomeModal() {
        //     this.incomeModalOpen = false;
        //     this.editingIncomeItem = null;
        // },
        // async handleIncomeSaved() {
        //     this.closeIncomeModal();
        //     // Небольшая задержка для обновления кэша на backend
        //     await new Promise(resolve => setTimeout(resolve, 100));
        //     this.fetchBalanceHistory();
        // },
        // handleIncomeSavedError(error) {
        //     console.error('Ошибка сохранения прихода:', error);
        // },
        // async handleIncomeDeleted() {
        //     this.closeIncomeModal();
        //     // Небольшая задержка для обновления кэша на backend
        //     await new Promise(resolve => setTimeout(resolve, 100));
        //     this.fetchBalanceHistory();
        // },
        // handleIncomeDeletedError(error) {
        //     console.error('Ошибка удаления прихода:', error);
        // },
        handleEntitySaved() {
            this.closeEntityModal();
            this.fetchBalanceHistory();
        },
        handleEntitySavedError(error) {
            console.error('Ошибка сохранения сущности:', error);
        },
        handleEntityDeleted() {
            this.closeEntityModal();
            this.fetchBalanceHistory();
        },
        handleEntityDeletedError(error) {
            console.error('Ошибка удаления сущности:', error);
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