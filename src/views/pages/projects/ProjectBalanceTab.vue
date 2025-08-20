<template>
    <div class="mt-4">
        <h3 class="text-md font-semibold mb-2">{{ $t('balanceHistory') }}</h3>
        <div class="mb-2 flex items-center gap-2">
                          <span>{{ $t('finalBalance') }}:</span>
            <span :class="{
                'text-[#5CB85C] font-bold': balance >= 0,
                'text-[#EE4F47] font-bold': balance < 0
            }">
                {{ balanceFormatted }} {{ currencyCode }}
            </span>
            <span class="ml-4">{{ $t('budget') }}: <b>{{ budgetFormatted }} {{ currencyCode }}</b></span>
        </div>
        <div v-if="balanceLoading" class="text-gray-500">{{ $t('loading') }}</div>
        <div v-else-if="balanceHistory.length === 0" class="text-gray-500">
            {{ $t('noHistory') }}
        </div>
        <DraggableTable v-if="!balanceLoading && balanceHistory.length" table-key="project.balance"
            :columns-config="columnsConfig" :table-data="balanceHistory" :item-mapper="itemMapper"
            @selectionChange="selectedIds = $event" :onItemClick="handleBalanceItemClick" />


    </div>
</template>

<script>
import DraggableTable from "@/views/components/app/forms/DraggableTable.vue";
import SideModalDialog from "@/views/components/app/dialog/SideModalDialog.vue";
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
    },
    props: {
        editingItem: { required: true },
    },
    data() {
        return {
            // Константы
            currencyCode: '',
            balanceLoading: false,
            balanceHistory: [],
            balance: 0,
            budget: 0,
            selectedEntity: null,
            entityModalOpen: false,
            entityLoading: false,
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
                            r.item.order_id,
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
                            r.item.updated_at
                        );
                    }),
                    componentName: 'TransactionCreatePage',
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
                    componentName: 'SaleCreatePage',
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
                            r.item.category_id,
                            r.item.category_name,
                            client,
                            r.item.products,
                            r.item.note ?? "",
                            r.item.description ?? "",
                            r.item.date,
                            r.item.created_at,
                            r.item.updated_at
                        );
                    }),
                    componentName: 'OrderCreatePage',
                    prop: 'editingItem',
                },
                receipt: {
                    fetch: async id => {
                        const { data } = await api.get(`/warehouse_receipts/${id}`);
                        return data.item ?? data;
                    },
                    componentName: 'WarehousesReceiptCreatePage',
                    prop: 'editingItem',
                },
            },
        };
    },
    computed: {
        balanceFormatted() {
            return this.balance ? parseFloat(this.balance).toFixed(2) : "0.00";
        },
        budgetFormatted() {
            return this.budget ? parseFloat(this.budget).toFixed(2) : "0.00";
        },
    },
    async mounted() {
        // Получаем дефолтную валюту
        await this.fetchDefaultCurrency();
        this.fetchBalanceHistory();
    },
    methods: {
        async fetchDefaultCurrency() {
            try {
                const currencies = await AppController.getCurrencies();
                const defaultCurrency = currencies.find(c => c.is_default);
                this.currencyCode = defaultCurrency ? defaultCurrency.code : 'TMT';
            } catch (error) {
                console.error('Ошибка при получении дефолтной валюты:', error);
                this.currencyCode = 'TMT';
            }
        },
        async fetchBalanceHistory() {
            if (!this.editingItem) return;
            this.balanceLoading = true;
            try {
                const data = await ProjectController.getBalanceHistory(this.editingItem.id);
                this.balanceHistory = (data.history || []).map(
                    (item) => ({
                        ...item,
                        formatDate() {
                            return item.date ? new Date(item.date).toLocaleString() : "";
                        },
                        formatAmountWithColor() {
                            const val = parseFloat(item.amount);
                            const color = val >= 0 ? "#5CB85C" : "#EE4F47";
                            return `<span style="color:${color};font-weight:bold">${val.toFixed(2)}</span>`;
                        },
                        label() {
                            switch (item.source) {
                                case "transaction": return this.$t('transaction');
                                case "sale": return this.$t('sale');
                                case "order": return this.$t('order');
                                case "receipt": return this.$t('receipt');
                                default: return item.source;
                            }
                        }
                    })
                );
                this.balance = data.balance;
                this.budget = data.budget;
            } catch (e) {
                console.error(this.$t("errorLoadingBalanceHistory"), e);
                this.balanceHistory = [];
                this.balance = 0;
                this.budget = 0;
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
            const config = this.ENTITY_CONFIG[item.source];
            if (!config) return;
            this.entityModalOpen = true;
            this.entityLoading = true;
            try {
                const data = await config.fetch(item.sourceId);
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
        async getModalComponent(type) {
            const config = this.ENTITY_CONFIG[type];
            if (!config || !config.componentName) return null;
            
            try {
                switch (config.componentName) {
                    case 'TransactionCreatePage':
                        return (await import('@/views/pages/transactions/TransactionCreatePage.vue')).default;
                    case 'SaleCreatePage':
                        return (await import('@/views/pages/sales/SaleCreatePage.vue')).default;
                    case 'OrderCreatePage':
                        return (await import('@/views/pages/orders/OrderCreatePage.vue')).default;
                    case 'WarehousesReceiptCreatePage':
                        return (await import('@/views/pages/warehouses/WarehousesReceiptCreatePage.vue')).default;
                    default:
                        return null;
                }
            } catch (error) {
                console.error('Ошибка загрузки компонента:', error);
                return null;
            }
        },
        closeEntityModal() {
            this.entityModalOpen = false;
            this.selectedEntity = null;
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