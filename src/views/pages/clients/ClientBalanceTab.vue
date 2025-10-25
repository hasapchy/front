<template>
    <div class="mt-4">
        <div class="flex justify-between items-center mb-2">
            <h3 class="text-md font-semibold">{{ $t('balanceHistory') }}</h3>
        </div>
        
        <!-- Статистика баланса -->
        <div class="mb-4">
            <div class="flex items-center gap-6">
                <!-- Кредит клиента (нам платят - зеленый) -->
                <span class="flex items-center gap-2">
                    <i class="fas fa-arrow-up text-[#5CB85C]"></i>
                    <span class="text-sm text-gray-600">{{ $t('debt') }}:</span>
                    <b class="text-[#5CB85C]">{{ totalIncomeDisplay }}</b>
                </span>
                
                <!-- Оплаты клиента (мы платим - красный) -->
                <span class="flex items-center gap-2">
                    <i class="fas fa-arrow-down text-[#EE4F47]"></i>
                    <span class="text-sm text-gray-600">{{ $t('income') }}:</span>
                    <b class="text-[#EE4F47]">{{ totalExpenseDisplay }}</b>
                </span>
                
                <!-- Итого (баланс клиента) -->
                <span class="flex items-center gap-2">
                    <i class="fas fa-wallet text-blue-500"></i>
                    <span class="text-sm text-gray-600">{{ balanceStatusText }}:</span>
                    <b :class="{
                        'text-[#5CB85C]': totalBalance >= 0,
                        'text-[#EE4F47]': totalBalance < 0
                    }">{{ formatBalance(totalBalance) }}</b>
                </span>
            </div>
        </div>

        <div v-if="balanceLoading" class="text-gray-500">{{ $t('loading') }}</div>
        <div v-else-if="!balanceHistory || balanceHistory.length === 0" class="text-gray-500">
            {{ $t('noHistory') }}
        </div>
        <DraggableTable v-if="!balanceLoading && balanceHistory && balanceHistory.length > 0 && editingItem" table-key="client.balance"
            :columns-config="columnsConfig" :table-data="balanceHistory" :item-mapper="itemMapper"
            :onItemClick="handleBalanceItemClick" />

        <!-- Модальное окно для транзакций -->
        <SideModalDialog :showForm="entityModalOpen" :onclose="closeEntityModal">
            <template v-if="entityLoading">
                <div class="p-8 flex justify-center items-center min-h-[200px]">
                    <svg class="animate-spin h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                    </svg>
                </div>
            </template>
            <template v-else>
                <TransactionCreatePage 
                    v-if="selectedEntity && selectedEntity.type === 'transaction'"
                    :editingItem="editingTransactionItem"
                    :preselectedClientId="editingItem.id"
                    @saved="onEntitySaved"
                    @saved-error="onEntitySavedError"
                    @deleted="onEntityDeleted"
                    @deleted-error="onEntityDeletedError" />
            </template>
        </SideModalDialog>
    </div>
</template>

<script>
import DraggableTable from "@/views/components/app/forms/DraggableTable.vue";
import SideModalDialog from "@/views/components/app/dialog/SideModalDialog.vue";
import PrimaryButton from "@/views/components/app/buttons/PrimaryButton.vue";
import { defineAsyncComponent } from 'vue';

const TransactionCreatePage = defineAsyncComponent(() => 
    import("@/views/pages/transactions/TransactionCreatePage.vue")
);
import TransactionController from "@/api/TransactionController";
import ClientController from "@/api/ClientController";
import ClientDto from "@/dto/client/ClientDto";
import TransactionDto from "@/dto/transaction/TransactionDto";

export default {
    components: {
        DraggableTable,
        SideModalDialog,
        PrimaryButton,
        TransactionCreatePage,
    },
    emits: ['balance-updated'],
    props: {
        editingItem: { 
            required: false,
            default: null,
            validator: function(value) {
                return value === null || (value && typeof value === 'object' && value.id !== undefined);
            }
        },
    },
    data() {
        return {
            currencyCode: '',

            balanceLoading: false,
            balanceHistory: [],
            lastFetchedClientId: null, // Для предотвращения дублирования запросов
            forceRefresh: false,
            totalBalance: 0,
            totalIncome: 0,
            totalExpense: 0,
            transactionModalOpen: false,
            editingTransactionItem: null,
            selectedEntity: null,
            entityModalOpen: false,
            entityLoading: false,
            columnsConfig: [
                { name: "id", label: "№", size: 60 },
                { name: "dateUser", label: this.$t("date"), size: 120 },
                { name: "operationType", label: this.$t("type"), size: 150, html: true },
                { name: "sourceType", label: "Источник", size: 120, html: true },
                { name: "note", label: this.$t("note"), size: 200 },
                { name: "user_name", label: this.$t("user"), size: 120 },
                { name: "clientImpact", label: this.$t("impact"), size: 130, html: true },
            ],
            ENTITY_CONFIG: {
                transaction: {
                    fetch: id => TransactionController.getItem(id).then(r => {
                        let client = null;
                        if (r.item.client) {
                            client = ClientDto.fromApi(r.item.client);
                        } else if (r.item.client_id && this.editingItem && this.editingItem.id) {
                            client = ClientDto.fromApi({
                                id: r.item.client_id,
                                client_type: this.editingItem.clientType || 'individual',
                                balance: this.editingItem.balance || '0.00',
                                is_supplier: this.editingItem.isSupplier || false,
                                is_conflict: this.editingItem.isConflict || false,
                                first_name: this.editingItem.firstName || 'Неизвестный',
                                last_name: this.editingItem.lastName || 'Клиент',
                                contact_person: this.editingItem.contactPerson || '',
                                address: this.editingItem.address || '',
                                note: this.editingItem.note || '',
                                status: this.editingItem.status || 'active',
                                discount_type: this.editingItem.discountType || 'none',
                                discount: this.editingItem.discount || 0,
                                created_at: this.editingItem.createdAt || new Date().toISOString(),
                                updated_at: this.editingItem.updatedAt || new Date().toISOString(),
                                emails: this.editingItem.emails || [],
                                phones: this.editingItem.phones || []
                            });
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
                },
            },
        };
    },
    async mounted() {
        await this.fetchDefaultCurrency();
        // fetchBalanceHistory вызывается через watch
    },

    methods: {
        // Helper функция для проверки is_debt
        isDebtOperation(item) {
            return item.is_debt === 1 || item.is_debt === true || item.is_debt === '1';
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
            if (!this.editingItem || !this.editingItem.id) return;
            
            // Предотвращаем повторные запросы для того же клиента
            if (this.lastFetchedClientId === this.editingItem.id && !this.forceRefresh) {
                return;
            }
            
            this.balanceLoading = true;
            try {
                const data = await ClientController.getBalanceHistory(
                    this.editingItem.id
                );
                const self = this; // Сохраняем ссылку на компонент
                
                // Маппим данные для отображения, добавляя методы форматирования
                this.balanceHistory = (data || []).map(item => {
                    return {
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
                            const formatted = self.$formatNumber(val, 2, true);
                            return `<span style="color:${color};font-weight:bold">${formatted} ${self.currencyCode}</span>`;
                        },
                        label() {
                            // Если это кредитная операция
                            if (self.isDebtOperation(item)) {
                                return '<i class="fas fa-arrow-up text-red-500 mr-2"></i> Продажа (кредит)';
                            }
                            
                            // Если это оплата кредита
                            return '<i class="fas fa-arrow-down text-green-500 mr-2"></i> Оплата клиента';
                        }
                    };
                });
                
                // Кредит клиента (дебет - что клиент нам должен)
                // Используем комбинацию: положительная сумма + is_debt=true
                const debtItems = this.balanceHistory.filter(item => {
                    const isPositive = parseFloat(item.amount) > 0;
                    console.log(`Операция ${item.sourceId}: is_debt=${item.is_debt}, amount=${item.amount}, isDebt=${this.isDebtOperation(item)}, isPositive=${isPositive}`);
                    return this.isDebtOperation(item) && isPositive;
                });
                console.log('Кредит клиента (дебет):', debtItems);
                this.totalIncome = debtItems.reduce((sum, item) => sum + parseFloat(item.amount), 0);

                // Оплаты клиента (кредит - что клиент нам заплатил)
                // Все остальные операции (не кредитные)
                const paymentItems = this.balanceHistory.filter(item => {
                    const isNotDebt = !this.isDebtOperation(item);
                    console.log(`Операция ${item.sourceId}: is_debt=${item.is_debt}, amount=${item.amount}, isDebt=${this.isDebtOperation(item)}, isNotDebt=${isNotDebt}`);
                    return isNotDebt;
                });
                console.log('Оплаты клиента (кредит):', paymentItems);
                this.totalExpense = paymentItems.reduce((sum, item) => sum + Math.abs(parseFloat(item.amount)), 0);
                
                console.log('Все операции:', this.balanceHistory);
                console.log('Итого кредит (дебет):', this.totalIncome);
                console.log('Итого оплаты (кредит):', this.totalExpense);
                
                // Используем реальный баланс клиента из API
                await this.updateClientBalance();
                this.totalBalance = parseFloat(this.editingItem.balance || 0);
                
                this.lastFetchedClientId = this.editingItem.id;
                this.forceRefresh = false;
            } catch (e) {
                this.balanceHistory = [];
                this.totalIncome = 0;
                this.totalExpense = 0;
                this.totalBalance = 0;
            } finally {
                this.balanceLoading = false;
            }
        },

        async handleBalanceItemClick(item) {
            if (!this.editingItem || !this.editingItem.id) return;
            
            // Всегда открываем транзакцию, поскольку именно в ней содержится финансовая информация
            try {
                this.entityLoading = true;
                // sourceId содержит ID транзакции
                const data = await this.ENTITY_CONFIG.transaction.fetch(item.sourceId);
                this.editingTransactionItem = data;
                
                this.entityModalOpen = true;
                this.selectedEntity = {
                    type: 'transaction',
                    data,
                };
            } catch (error) {
                console.error('Error loading transaction:', error);
                this.$notify?.({ type: 'error', text: 'Ошибка при загрузке транзакции' });
            } finally {
                this.entityLoading = false;
            }
        },
        closeEntityModal() {
            this.entityModalOpen = false;
            this.selectedEntity = null;
            this.entityLoading = false;
        },
        onEntitySaved() {
            if (this.editingItem && this.editingItem.id) {
                this.fetchBalanceHistory();
                this.updateClientBalance();
            }
            this.$emit('balance-updated');
            this.closeEntityModal();
        },
        onEntitySavedError(error) {
            this.closeEntityModal();
        },
        onEntityDeleted() {
            if (this.editingItem && this.editingItem.id) {
                this.fetchBalanceHistory();
                this.updateClientBalance();
            }
            this.$emit('balance-updated');
            this.closeEntityModal();
        },
        onEntityDeletedError(error) {
            this.closeEntityModal();
        },
        async updateClientBalance() {
            if (!this.editingItem || !this.editingItem.id) return;
            try {
                const updatedClient = await ClientController.getItem(this.editingItem.id);
                this.editingItem.balance = updatedClient.balance;

            } catch (error) {
                console.error('Ошибка при обновлении баланса клиента:', error);
                // Если клиент не найден (404), не обновляем баланс
                if (error.response?.status === 404) {
                    console.warn('Клиент не найден, пропускаем обновление баланса');
                }
            }
        },
        formatBalance(balance) {
            return `${this.$formatNumber(balance, 2, true)} ${this.currencyCode}`;
        },
        itemMapper(i, c) {
            switch (c) {
                case "id":
                    return i.sourceId || '-';
                case "operationType":
                    return this.isDebtOperation(i)
                        ? '<i class="fas fa-arrow-up text-red-500 mr-2"></i> Продажа (кредит)'
                        : '<i class="fas fa-arrow-down text-green-500 mr-2"></i> Оплата клиента';
                case "sourceType":
                    // Используем короткие названия с иконками вместо полных путей
                    if (i.source === 'sale') {
                        return '<i class="fas fa-shopping-cart text-blue-500 mr-2"></i>Продажа';
                    } else if (i.source === 'order') {
                        return '<i class="fas fa-clipboard-list text-purple-500 mr-2"></i>Заказ';
                    } else if (i.source === 'receipt') {
                        return '<i class="fas fa-box text-orange-500 mr-2"></i>Оприходование';
                    } else if (i.source === 'transaction') {
                        return '<i class="fas fa-exchange-alt text-gray-500 mr-2"></i>Транзакция';
                    } else {
                        return '<i class="fas fa-exchange-alt text-gray-500 mr-2"></i>Транзакция';
                    }
                case "user_name":
                    return i.user_name || '-';
                case "clientImpact":
                    const formattedAmount = this.$formatNumber(Math.abs(parseFloat(i.amount)), 2, true);
                    const currencySymbol = this.currencyCode || '';
                    
                    if (this.isDebtOperation(i)) {
                        // Кредит: увеличиваем задолженность (+amount) - красный
                        return `<span class="text-red-500 font-semibold">+${formattedAmount} ${currencySymbol}</span>`;
                    } else {
                        // Оплата: уменьшаем задолженность (-amount) - зелёный
                        return `<span class="text-green-500 font-semibold">-${formattedAmount} ${currencySymbol}</span>`;
                    }
                default:
                    return i[c];
            }
        },
    },
    computed: {
        totalIncomeDisplay() {
            return `${this.$formatNumber(this.totalIncome, 2, true)} ${this.currencyCode}`;
        },
        totalExpenseDisplay() {
            return `${this.$formatNumber(this.totalExpense, 2, true)} ${this.currencyCode}`;
        },
        balanceStatusText() {
            if (this.totalBalance > 0) {
                return 'Клиент нам должен';
            } else if (this.totalBalance < 0) {
                return 'Мы клиенту должны';
            } else {
                return 'Взаиморасчеты';
            }
        }
    },
    watch: {
        'editingItem.id': {
            handler(newId) {
                if (newId) {
                    this.fetchBalanceHistory();
                } else {
                    this.balanceHistory = [];
                    this.lastFetchedClientId = null;
                    this.selectedEntity = null;
                    this.entityModalOpen = false;
                    this.entityLoading = false;
                    this.totalBalance = 0;
                    this.totalIncome = 0;
                    this.totalExpense = 0;
                }
            },
            immediate: true,
        },
    },
};
</script>
