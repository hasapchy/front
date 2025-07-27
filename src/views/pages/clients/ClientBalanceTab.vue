<template>
    <div class="mt-4">
        <h3 class="text-md font-semibold mb-2">История баланса</h3>
        <div class="mb-2 flex items-center gap-2">
            <span>Итоговый баланс:</span>
            <span :class="{
                'text-[#5CB85C] font-bold': editingItem && editingItem.balanceNumeric() >= 0,
                'text-[#EE4F47] font-bold': editingItem && editingItem.balanceNumeric() < 0
            }">
                {{ editingItem ? editingItem.balanceFormatted() : "0.00" }} TMT
            </span>
        </div>

        <div v-if="balanceLoading" class="text-gray-500">Загрузка...</div>
        <div v-else-if="balanceHistory.length === 0" class="text-gray-500">
            История отсутствует
        </div>
        <DraggableTable v-if="!balanceLoading && balanceHistory.length" table-key="client.balance"
            :columns-config="columnsConfig" :table-data="balanceHistory" :item-mapper="itemMapper" @selectionChange="selectedIds = $event"
            :onItemClick="handleBalanceItemClick" />

        <!-- Модалка для entity -->
        <SideModalDialog :showForm="entityModalOpen" :onclose="closeEntityModal">
            <template v-if="entityLoading">
                <div class="p-8 flex justify-center items-center min-h-[200px]">
                    <svg class="animate-spin h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                </div>
            </template>
            <template v-else-if="selectedEntity">
                <component :is="getModalComponent(selectedEntity.type)" v-bind="getModalProps(selectedEntity)" />
            </template>
        </SideModalDialog>
    </div>
</template>

<script>
import DraggableTable from "@/views/components/app/forms/DraggableTable.vue";
import SideModalDialog from "@/views/components/app/dialog/SideModalDialog.vue";
import TransactionCreatePage from "@/views/pages/transactions/TransactionCreatePage.vue";
import SaleCreatePage from "@/views/pages/sales/SaleCreatePage.vue";
import OrderCreatePage from "@/views/pages/orders/OrderCreatePage.vue";
import WarehousesReceiptCreatePage from "@/views/pages/warehouses/WarehousesReceiptCreatePage.vue";
import TransactionController from "@/api/TransactionController";
import ClientController from "@/api/ClientController";
import SaleController from "@/api/SaleController";
import OrderController from "@/api/OrderController";
import WarehouseReceiptController from "@/api/WarehouseReceiptController";
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
    props: {
        editingItem: { required: true },
    },
    data() {
        return {
            balanceLoading: false,
            balanceHistory: [],
            selectedEntity: null,
            entityModalOpen: false,
            entityLoading: false, // NEW: loading state for modal
            columnsConfig: [
                { name: "date", label: "Дата", size: 100 },
                { name: "type", label: "Тип" },
                { name: "description", label: "Описание", size: 600 },
                { name: "amount", label: "Сумма", size: 120, html: true },
            ],
            ENTITY_CONFIG: {
                transaction: {
                    fetch: id => TransactionController.getItem(id).then(r => {
                        let client = null;
                        if (r.item.client) {
                            client = new ClientDto(
                                r.item.client.id,
                                r.item.client.client_type,
                                r.item.client.balance,
                                r.item.client.is_supplier,
                                r.item.client.is_conflict,
                                r.item.client.first_name,
                                r.item.client.last_name,
                                r.item.client.contact_person,
                                r.item.client.address,
                                r.item.client.note,
                                r.item.client.status,
                                r.item.client.discount_type,
                                r.item.client.discount,
                                r.item.client.created_at,
                                r.item.client.updated_at,
                                r.item.client.emails,
                                r.item.client.phones
                            );
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
                    component: TransactionCreatePage,
                    prop: 'editingItem',
                },
                sale: {
                    fetch: id => SaleController.getItem(id).then(r => {
                        let client = null;
                        if (r.item.client) {
                            client = new ClientDto(
                                r.item.client.id,
                                r.item.client.client_type,
                                r.item.client.balance,
                                r.item.client.is_supplier,
                                r.item.client.is_conflict,
                                r.item.client.first_name,
                                r.item.client.last_name,
                                r.item.client.contact_person,
                                r.item.client.address,
                                r.item.client.note,
                                r.item.client.status,
                                r.item.client.discount_type,
                                r.item.client.discount,
                                r.item.client.created_at,
                                r.item.client.updated_at,
                                r.item.client.emails,
                                r.item.client.phones
                            );
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
                    component: SaleCreatePage,
                    prop: 'editingItem',
                },
                order: {
                    fetch: id => OrderController.getItem(id).then(r => {
                        let client = null;
                        if (r.item.client) {
                            client = new ClientDto(
                                r.item.client.id,
                                r.item.client.client_type,
                                r.item.client.balance,
                                r.item.client.is_supplier,
                                r.item.client.is_conflict,
                                r.item.client.first_name,
                                r.item.client.last_name,
                                r.item.client.contact_person,
                                r.item.client.address,
                                r.item.client.note,
                                r.item.client.status,
                                r.item.client.discount_type,
                                r.item.client.discount,
                                r.item.client.created_at,
                                r.item.client.updated_at,
                                r.item.client.emails,
                                r.item.client.phones
                            );
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
                    component: OrderCreatePage,
                    prop: 'editingItem',
                },
                receipt: {
                    fetch: async id => {
                        const { data } = await api.get(`/warehouse_receipts/${id}`);
                        return data.item ?? data;
                    },
                    component: WarehousesReceiptCreatePage,
                    prop: 'editingItem',
                },
            },
        };
    },
    mounted() {
        this.fetchBalanceHistory();
    },
    methods: {
        async fetchBalanceHistory() {
            if (!this.editingItem) return;
            this.balanceLoading = true;
            try {
                this.balanceHistory = await ClientController.getBalanceHistory(
                    this.editingItem.id
                );
            } catch (e) {
                console.error("Ошибка при загрузке истории баланса:", e);
                this.balanceHistory = [];
            }
            this.balanceLoading = false;
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
        getModalComponent(type) {
            return this.ENTITY_CONFIG[type]?.component || null;
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
