<template>
    <div class="mt-4">
        <div class="flex justify-between items-center mb-2">
            <h3 class="text-md font-semibold">{{ $t('balanceHistory') }}</h3>
            <PrimaryButton 
                icon="fas fa-adjust" 
                :onclick="openAdjustmentModal"
                :is-success="true"
                :disabled="!editingItem || !editingItem.id">
                {{ $t('adjustBalance') }}
            </PrimaryButton>
        </div>
        
        <!-- Итого (баланс клиента) -->
        <div v-if="!balanceLoading && editingItem" class="mb-4">
            <div class="flex items-center gap-2">
                <i class="fas fa-wallet text-blue-500"></i>
                <span class="text-sm text-gray-600">{{ balanceStatusText }}:</span>
                <b :class="{
                    'text-[#5CB85C]': totalBalance >= 0,
                    'text-[#EE4F47]': totalBalance < 0
                }">{{ formatBalance(totalBalance) }}</b>
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
                    :forceDebt="isAdjustmentMode"
                    :requireNote="isAdjustmentMode"
                    :adjustmentMode="isAdjustmentMode"
                    :adjustmentType="0"
                    :initialClient="editingItem"
                    @saved="() => { onEntitySaved(); forceRefresh = true; }"
                    @saved-error="onEntitySavedError"
                    @deleted="() => { onEntityDeleted(); forceRefresh = true; }"
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
            transactionModalOpen: false,
            editingTransactionItem: null,
            selectedEntity: null,
            entityModalOpen: false,
            entityLoading: false,
            isAdjustmentMode: false,
            columnsConfig: [
                { name: "id", label: "№", size: 60 },
                { name: "dateUser", label: this.$t("date"), size: 120 },
                { name: "operationType", label: this.$t("type"), size: 150, html: true },
                { name: "sourceType", label: "Источник", size: 120, html: true },
                { name: "note", label: this.$t("note"), size: 200 },
                { name: "debt", label: "Долг", size: 80, html: true },
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
        formatBalance(balance) {
            return `${this.$formatNumber(balance, 2, true)} ${this.currencyCode}`;
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
                            // Положительная сумма (долг) - красный, отрицательная (оплата) - зеленый
                            const color = val >= 0 ? "#EE4F47" : "#5CB85C";
                            const formatted = self.$formatNumber(val, 2, true);
                            return `<span style="color:${color};font-weight:bold">${formatted} ${self.currencyCode}</span>`;
                        },
                        label() {
                            // Положительная сумма - долг клиента
                            if (parseFloat(item.amount) > 0) {
                                return '<i class="fas fa-arrow-up text-red-500 mr-2"></i> Долг клиента';
                            }
                            
                            // Отрицательная сумма - оплата клиента
                            return '<i class="fas fa-arrow-down text-green-500 mr-2"></i> Оплата клиента';
                        }
                    };
                });
                
                // Подсчитываем итоговый баланс клиента
                this.totalBalance = parseFloat(this.editingItem.balance || 0);
                
                this.lastFetchedClientId = this.editingItem.id;
                this.forceRefresh = false;
            } catch (e) {
                this.balanceHistory = [];
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
            this.isAdjustmentMode = false;
        },
        onEntitySaved() {
            if (this.editingItem && this.editingItem.id) {
                this.fetchBalanceHistory();
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
            }
            this.$emit('balance-updated');
            this.closeEntityModal();
        },
        onEntityDeletedError(error) {
            this.closeEntityModal();
        },
        openAdjustmentModal() {
            this.isAdjustmentMode = true;
            this.entityModalOpen = true;
            this.selectedEntity = { type: 'transaction' };
            this.editingTransactionItem = null; // Открываем пустую форму для создания
        },
        itemMapper(i, c) {
            switch (c) {
                case "id":
                    return i.sourceId || '-';
                case "operationType": {
                    const amount = parseFloat(i.amount);
                    const isDebt = i.is_debt === 1 || i.is_debt === true || i.is_debt === '1';
                    
                    // Логика: если is_debt=true и положительная сумма - это кредит клиента
                    // Если is_debt=false и положительная сумма - это оплаченная операция
                    // Отрицательная сумма - всегда оплата долга
                    if (amount > 0 && isDebt) {
                        return '<i class="fas fa-arrow-up text-[#EE4F47] mr-2"></i><span class="text-[#EE4F47]">Кредит клиента</span>';
                    } else if (amount > 0 && !isDebt) {
                        return '<i class="fas fa-check text-[#5CB85C] mr-2"></i><span class="text-[#5CB85C]">Оплачено</span>';
                    } else if (amount < 0) {
                        return '<i class="fas fa-arrow-down text-[#5CB85C] mr-2"></i><span class="text-[#5CB85C]">Оплата клиента</span>';
                    } else {
                        return '<i class="fas fa-exchange-alt text-gray-500 mr-2"></i><span class="text-gray-500">Транзакция</span>';
                    }
                }
                case "sourceType":
                    // Используем короткие названия с иконками вместо полных путей
                    if (i.source === 'sale') {
                        return '<i class="fas fa-shopping-cart text-[#5CB85C] mr-2"></i><span class="text-[#5CB85C]">Продажа</span>';
                    } else if (i.source === 'order') {
                        return '<i class="fas fa-clipboard-list text-[#337AB7] mr-2"></i><span class="text-[#337AB7]">Заказ</span>';
                    } else if (i.source === 'receipt') {
                        return '<i class="fas fa-box text-[#FFA500] mr-2"></i><span class="text-[#FFA500]">Оприходование</span>';
                    } else if (i.source === 'transaction') {
                        return '<i class="fas fa-exchange-alt text-[#6C757D] mr-2"></i><span class="text-[#6C757D]">Транзакция</span>';
                    } else {
                        return '<i class="fas fa-exchange-alt text-[#6C757D] mr-2"></i><span class="text-[#6C757D]">Транзакция</span>';
                    }
                case "user_name":
                    return i.user_name || '-';
                case "note":
                    return i.note || '-';
                case "debt": {
                    const isDebt = i.is_debt === 1 || i.is_debt === true || i.is_debt === '1';
                    return isDebt ? '<span class="text-green-500 font-bold">✓</span>' : '<span class="text-gray-400">-</span>';
                }
                case "clientImpact": {
                    const amount = parseFloat(i.amount);
                    const currencySymbol = this.currencyCode || '';
                    const isDebt = i.is_debt === 1 || i.is_debt === true || i.is_debt === '1';
                    
                    // Логика на основе is_debt
                    // is_debt = 1 → Продажа (начисление долга) → +amount (красный)
                    // is_debt = 0 → Оплата (погашение долга) → -amount (зеленый)
                    if (isDebt) {
                        // Долговая операция: всегда показываем положительное значение красным
                        return `<span class="text-[#EE4F47] font-semibold">+${this.$formatNumber(Math.abs(amount), 2, true)} ${currencySymbol}</span>`;
                    } else {
                        // Оплата: всегда показываем отрицательное значение зеленым
                        return `<span class="text-[#5CB85C] font-semibold">-${this.$formatNumber(Math.abs(amount), 2, true)} ${currencySymbol}</span>`;
                    }
                }
                default:
                    return i[c];
            }
        },
    },
    computed: {
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
                }
            },
            immediate: true,
        },
    },
};
</script>
