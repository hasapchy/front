<template>
    <div class="mt-4">
        <div class="flex justify-between items-center mb-2">
            <h3 class="text-md font-semibold">{{ $t('paymentsHistory') }}</h3>
            <PrimaryButton 
                icon="fas fa-plus" 
                :onclick="openCreatePaymentModal"
                :is-success="true"
                :disabled="!editingItem || !editingItem.id">
                {{ $t('createPayment') }}
            </PrimaryButton>
        </div>

        <!-- Итого платежей -->
        <div v-if="!paymentsLoading && editingItem && totalPayments > 0" class="mb-4">
            <div class="flex items-center gap-2">
                <i class="fas fa-money-bill text-green-500"></i>
                <span class="text-sm text-gray-600">{{ $t('totalPayments') }}:</span>
                <b class="text-[#5CB85C]">{{ formatBalance(totalPayments) }}</b>
            </div>
        </div>

        <div v-if="paymentsLoading" class="text-gray-500">{{ $t('loading') }}</div>
        <div v-else-if="!paymentsHistory || paymentsHistory.length === 0" class="text-gray-500">
            {{ $t('noHistory') }}
        </div>
        <DraggableTable v-if="!paymentsLoading && paymentsHistory && paymentsHistory.length > 0 && editingItem" table-key="client.payments"
            :columns-config="columnsConfig" :table-data="paymentsHistory" :item-mapper="itemMapper"
            :onItemClick="handlePaymentItemClick" />

        <!-- Notification Toast -->
        <NotificationToast 
            :title="notificationTitle" 
            :subtitle="notificationSubtitle" 
            :show="notification" 
            :is-danger="notificationIsDanger" 
            @close="closeNotification" 
        />

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
                    :initialClient="editingItem"
                    :forceDebt="false"
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
import NotificationToast from "@/views/components/app/dialog/NotificationToast.vue";
import getApiErrorMessage from "@/mixins/getApiErrorMessageMixin";
import notificationMixin from "@/mixins/notificationMixin";
import { defineAsyncComponent } from 'vue';

const TransactionCreatePage = defineAsyncComponent(() => 
    import("@/views/pages/transactions/TransactionCreatePage.vue")
);
import TransactionController from "@/api/TransactionController";
import ClientController from "@/api/ClientController";
import ClientDto from "@/dto/client/ClientDto";
import TransactionDto from "@/dto/transaction/TransactionDto";

export default {
    mixins: [notificationMixin, getApiErrorMessage],
    components: {
        DraggableTable,
        SideModalDialog,
        PrimaryButton,
        NotificationToast,
        TransactionCreatePage,
    },
    emits: ['payments-updated'],
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

            paymentsLoading: false,
            paymentsHistory: [],
            lastFetchedClientId: null,
            forceRefresh: false,
            totalPayments: 0,
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
                { name: "clientImpact", label: this.$t("amount"), size: 130, html: true },
            ],
        };
    },
    async mounted() {
        await this.fetchDefaultCurrency();
    },

    methods: {
        // Вспомогательный метод для обновления данных клиента
        async updateClientData() {
            if (!this.editingItem || !this.editingItem.id) return;
            try {
                const updatedClient = await ClientController.getItem(this.editingItem.id);
                if (updatedClient && updatedClient.balance !== undefined) {
                    this.editingItem.balance = updatedClient.balance;
                }
            } catch (error) {
                console.error('Error updating client data:', error);
            }
        },
        // Вспомогательный метод для обработки ошибок
        handleEntityError(error) {
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
        formatBalance(balance) {
            return `${this.$formatNumber(balance, 2, true)} ${this.currencyCode}`;
        },
        async fetchDefaultCurrency() {
            try {
                await this.$store.dispatch('loadCurrencies');
                const currencies = this.$store.getters.currencies;
                const defaultCurrency = currencies.find(c => c.is_default);
                this.currencyCode = defaultCurrency ? defaultCurrency.symbol : 'Нет валюты';
            } catch (error) {
                this.currencyCode = 'Нет валюты';
            }
        },
        async fetchPaymentsHistory() {
            if (!this.editingItem || !this.editingItem.id) return;
            
            if (this.lastFetchedClientId === this.editingItem.id && !this.forceRefresh) {
                return;
            }
            
            this.paymentsLoading = true;
            try {
                const data = await ClientController.getBalanceHistory(
                    this.editingItem.id
                );
                const self = this;
                
                // Фильтруем только не кредитные транзакции (is_debt = 0)
                const filteredData = (data || []).filter(item => 
                    item.is_debt !== 1 && item.is_debt !== true && item.is_debt !== '1'
                );
                
                // Маппим данные для отображения
                this.paymentsHistory = filteredData.map(item => {
                    return {
                        ...item,
                        get dateUser() {
                            return item.date ? new Date(item.date).toLocaleString() : "";
                        },
                    };
                });
                
                // Подсчитываем итоговую сумму платежей
                this.totalPayments = filteredData.reduce((sum, item) => {
                    const amount = parseFloat(item.amount || 0);
                    return sum + Math.abs(amount);
                }, 0);
                
                this.lastFetchedClientId = this.editingItem.id;
                this.forceRefresh = false;
            } catch (e) {
                this.paymentsHistory = [];
                this.totalPayments = 0;
            } finally {
                this.paymentsLoading = false;
            }
        },

        async handlePaymentItemClick(item) {
            if (!this.editingItem || !this.editingItem.id) return;
            
            try {
                this.entityLoading = true;
                const response = await TransactionController.getItem(item.sourceId);
                let client = null;
                if (response.item.client) {
                    client = ClientDto.fromApi(response.item.client);
                } else if (response.item.client_id && this.editingItem && this.editingItem.id) {
                    client = ClientDto.fromApi({
                        id: response.item.client_id,
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
                const data = new TransactionDto(
                    response.item.id,
                    response.item.type,
                    response.item.is_transfer,
                    response.item.is_sale || 0,
                    response.item.is_receipt || 0,
                    response.item.is_debt || 0,
                    response.item.cash_id,
                    response.item.cash_name,
                    response.item.cash_amount,
                    response.item.cash_currency_id,
                    response.item.cash_currency_name,
                    response.item.cash_currency_code,
                    response.item.cash_currency_symbol,
                    response.item.orig_amount,
                    response.item.orig_currency_id,
                    response.item.orig_currency_name,
                    response.item.orig_currency_code,
                    response.item.orig_currency_symbol,
                    response.item.user_id,
                    response.item.user_name,
                    response.item.category_id,
                    response.item.category_name,
                    response.item.category_type,
                    response.item.project_id,
                    response.item.project_name,
                    response.item.client_id,
                    client,
                    response.item.note,
                    response.item.date,
                    response.item.created_at,
                    response.item.updated_at,
                    response.item.orders || [],
                    response.item.source_type || null,
                    response.item.source_id || null
                );
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
        async onEntitySaved() {
            this.entityModalOpen = false;
            if (this.editingItem && this.editingItem.id) {
                await this.updateClientData();
                this.forceRefresh = true;
                await this.fetchPaymentsHistory();
            }
            this.$emit('payments-updated');
        },
        onEntitySavedError(error) {
            this.handleEntityError(error);
        },
        async onEntityDeleted() {
            this.entityModalOpen = false;
            if (this.editingItem && this.editingItem.id) {
                await this.updateClientData();
                this.forceRefresh = true;
                await this.fetchPaymentsHistory();
            }
            this.$emit('payments-updated');
        },
        onEntityDeletedError(error) {
            this.handleEntityError(error);
        },
        openCreatePaymentModal() {
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
                    // Все платежи в этой вкладке - не кредитные (is_debt = 0)
                    if (amount > 0) {
                        return '<i class="fas fa-check text-[#5CB85C] mr-2"></i><span class="text-[#5CB85C]">Оплата получена</span>';
                    } else {
                        return '<i class="fas fa-exchange-alt text-gray-500 mr-2"></i><span class="text-gray-500">Оплата</span>';
                    }
                }
                case "sourceType":
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
                case "clientImpact": {
                    const amount = parseFloat(i.amount);
                    const currencySymbol = this.currencyCode || '';
                    // Показываем сумму зеленым цветом
                    return `<span class="text-[#5CB85C] font-semibold">${this.$formatNumber(Math.abs(amount), 2, true)} ${currencySymbol}</span>`;
                }
                default:
                    return i[c];
            }
        },
    },
    watch: {
        'editingItem.id': {
            handler(newId) {
                if (newId) {
                    this.fetchPaymentsHistory();
                } else {
                    this.paymentsHistory = [];
                    this.lastFetchedClientId = null;
                    this.selectedEntity = null;
                    this.entityModalOpen = false;
                    this.entityLoading = false;
                    this.totalPayments = 0;
                }
            },
            immediate: true,
        },
    },
};
</script>
