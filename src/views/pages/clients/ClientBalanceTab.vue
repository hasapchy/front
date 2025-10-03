<template>
    <div class="mt-4">
        <h3 class="text-md font-semibold mb-2">{{ $t('balanceHistory') }}</h3>
        <div v-if="editingItem" class="mb-2 flex items-center gap-2">
            <span>{{ $t('finalBalance') }}:</span>
            <span :class="{
                'text-[#5CB85C] font-bold': editingItem.balance >= 0,
                'text-[#EE4F47] font-bold': editingItem.balance < 0
            }">
                {{ editingItem.balanceFormatted() }} {{ currencyCode }}
            </span>
        </div>

        <div v-if="balanceLoading" class="text-gray-500">{{ $t('loading') }}</div>
        <div v-else-if="!balanceHistory || balanceHistory.length === 0" class="text-gray-500">
            {{ $t('noHistory') }}
        </div>
        <DraggableTable v-if="!balanceLoading && balanceHistory && balanceHistory.length > 0 && editingItem" table-key="client.balance"
            :columns-config="columnsConfig" :table-data="balanceHistory" :item-mapper="itemMapper"
            :onItemClick="handleBalanceItemClick" />

        <SideModalDialog :showForm="entityModalOpen" :onclose="closeEntityModal">
            <template v-if="entityLoading">
                <div class="p-8 flex justify-center items-center min-h-[200px]">
                    <svg class="animate-spin h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                </div>
            </template>
            <template v-else-if="selectedEntity && selectedEntity.type && selectedEntity.data">
                <component 
                    :is="getModalComponent(selectedEntity.type)" 
                    v-bind="getModalProps(selectedEntity)"
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
import ClientController from "@/api/ClientController";
import SaleController from "@/api/SaleController";
import OrderController from "@/api/OrderController";
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
        TransactionCreatePage,
        SaleCreatePage,
        OrderCreatePage,
        WarehousesReceiptCreatePage,
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
            selectedEntity: null,
            entityModalOpen: false,
            entityLoading: false,
            columnsConfig: [
                { name: "date", label: this.$t("date"), size: 100 },
                { name: "type", label: this.$t("type") },
                { name: "description", label: this.$t("description"), size: 600 },
                { name: "amount", label: this.$t("amount"), size: 120, html: true },
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
            },
        };
    },
    async mounted() {
        await this.fetchDefaultCurrency();
        
        if (this.editingItem && this.editingItem.id) {
            this.fetchBalanceHistory();
        }
    },

    methods: {
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
            this.balanceLoading = true;
            try {
                this.balanceHistory = await ClientController.getBalanceHistory(
                    this.editingItem.id
                );
                
                await this.updateClientBalance();
            } catch (e) {
                this.balanceHistory = [];
            } finally {
                this.balanceLoading = false;
            }
        },

        itemMapper(i, c) {
            switch (c) {
                case "date":
                    return i.formatDate();
                case "type":
                    return i.label?.() ?? i.type;
                case "description":
                    return i.description;
                case "amount":
                    return i.formatAmountWithColor?.();
                default:
                    return i[c];
            }
        },
        async handleBalanceItemClick(item) {
            if (!this.editingItem || !this.editingItem.id) return;
            
            const config = this.ENTITY_CONFIG[item.source];
            if (!config) return;
            this.entityModalOpen = true;
            this.entityLoading = true;
            try {
                const data = await config.fetch(item.sourceId);
                if (data) {
                    this.selectedEntity = {
                        type: item.source,
                        data,
                    };
                } else {
                    throw new Error('Данные не загружены');
                }
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
            if (!config) return {};
            

            if (entity.type === 'transaction' && entity.data && !entity.data.client && entity.data.clientId && this.editingItem && this.editingItem.id) {
                const client = ClientDto.fromApi({
                    id: entity.data.clientId,
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
                return { [config.prop]: { ...entity.data, client } };
            }
            
            return { [config.prop]: entity.data };
        },
        getModalComponent(type) {
            const component = this.ENTITY_CONFIG[type]?.component;
            return component || null;
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
    },
    watch: {
        editingItem: {
            handler(newVal) {
                if (newVal && newVal.id) {
                    this.fetchBalanceHistory();
                } else {
                    this.balanceHistory = [];
                    this.selectedEntity = null;
                    this.entityModalOpen = false;
                    this.entityLoading = false;
                }
            },
            immediate: true,
        },
    },
};
</script>
